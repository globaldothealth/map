import ReactDOM from 'react-dom';
import React, {useEffect, useRef, useState} from 'react';
import {ActionCreatorWithPayload} from '@reduxjs/toolkit';
import {Feature, FeatureCollection} from 'geojson';
import {DataDrivenPropertyValueSpecification, Map, Popup} from 'maplibre-gl';
import useMediaQuery from '@mui/material/useMediaQuery';

import MapPopup from 'src/components/MapPopup';
import {PopupContentText} from 'src/components/MapPopup/styled';
import {ChoroplethMapColors} from 'src/models/Colors';
import {CountryData} from 'src/models/CountryData';
import {FocusedArea} from 'src/models/FocusedArea';
import {RegionalData} from 'src/models/RegionalData';
import {StateData} from 'src/models/StateData';
import {useAppDispatch} from 'src/redux/hooks';
import {convertStringDateToDate} from 'src/utils/helperFunctions';

export const usePathingLayer = (
    map: Map | null,
    adminLevel: number,
    data: CountryData[] | StateData[] | RegionalData[],
    setMapLoaded: React.Dispatch<React.SetStateAction<boolean>>,
    mapLoaded: boolean,
    dataFeatureSet: FeatureCollection,
    setFocusedArea: ActionCreatorWithPayload<FocusedArea | null>,
    focusedArea: FocusedArea | null,
    dataLayerBounds: {
        [key: string]: {
            lower: { number: number; text: string };
            upper: { number: number; text: string };
        };
    },
    pathData: any,
    overlaysOpen: { [key: string]: boolean },
    statusColors: { [key: string]: string },
    dateUpTo: string,
) => {
    const dispatch = useAppDispatch();
    const smallScreen = useMediaQuery('(max-width:1400px)');
    const [currentPopup, setCurrentPopup] = useState<Popup | null>();
    const traceDestinationsFeaturesRef = useRef<any[]>([]);

    // Constants
    const locationNameToLongLat: Record<string, { long: number; lat: number }> = {
        "St. Helena": {long: -5.70, lat: -15.95},
        "Ascension": {long: -14.25, lat: -7.95},
        "Canary Islands": {long: -15.50, lat: 28.25},
        "Buenos Aires, Argentina": {long: -58.3816, lat: -34.6037},
        "Johannesburg, South Africa": {long: 28.0473, lat: -26.2041},
        "South Africa": {long: 22.9375, lat: -30.5595},
        "Zurich, Switzerland": {long: 8.5417, lat: 47.3769},
        "Amsterdam, Netherlands": {long: 4.9041, lat: 52.3676},
        "Netherlands": {long: 5.2913, lat: 52.1326},
        "Netherlands (arrived 2026-05-07)": {long: 5.2913, lat: 52.1326},
        "Netherlands, then Dusseldorf, Germany": {long: 6.7735, lat: 51.2277},
        "Singapore": {long: 103.8198, lat: 1.3521},
        "Paris, France": {long: 2.3522, lat: 48.8566},
        "Nebraska": {long: -99.9018, lat: 41.4925},
        "Rome, Italy": {long: 12.4964, lat: 41.9028},
        "Ushuaia Argentina": {long: -68.3059, lat: -54.8019},
        "Tristan de Cunha": {long: -12.322772, lat: -37.1052},
        "Praia, Cape Verde": {long: -23.5087, lat: 14.9330},
        "Tenerife, Canary Islands": {long: -16.6291, lat: 28.2916},
        "Cape Verde": {long: -24.0, lat: 16.0},
        "Tenerife": {long: -16.6291, lat: 28.2916},
        "United Kingdom": {long: -3.4360, lat: 55.3781},
        "United States": {long: -95.7129, lat: 37.0902},
        "Spain": {long: -3.7492, lat: 40.4637},
        "France": {long: 2.2137, lat: 46.2276},
        "Canada": {long: -106.3468, lat: 56.1304},
        "Turkey": {long: 35.2433, lat: 38.9637},
        "Ireland": {long: -8.2439, lat: 53.1424},
        "South Georgia": {long: -36.4939, lat: -54.4296},
        "Tristan da Cunha, Inaccesible Island & Nightingale Island": {long: -12.322772, lat: -37.1052},
        "Tristan da Cunha": {long: -12.322772, lat: -37.1052},
        "Gough Island": {long: -5.3167, lat: -40.3333},
        // Using the location between south georgia and tristan de cunha for the stop
        '%ship-04-11': {long: -24.408, lat: -45.7674},
        '%ship-05-02': {long: -22.7, lat: 12.9330},
        "Madrid, Spain": {long: -3.7038, lat: 40.4168},
        "Vancouver Island, British Columbia, Canada": {long: -126.0, lat: 49.0},
        "Nebraska, US": {long: -99.9018, lat: 41.4925},
    }
    const shipPath = [
        {
            location: 'Ushuaia Argentina',
            date: '2026-04-01',
            dateStart: '2026-04-01',
            dateEnd: '2026-04-01',
        },
        {
            location: 'South Georgia',
            date: 'April 4th-7th 2026',
            dateStart: '2026-04-04',
            dateEnd: '2026-04-04',
        },
        {
            location: 'Tristan da Cunha, Inaccesible Island & Nightingale Island',
            date: 'April 13th-16th 2026',
            dateStart: '2026-04-13',
            dateEnd: '2026-04-16',
            description: "The ship's itinerary listed visits to Inaccessible Island, Nightingale, and Gough Island\n" +
                "\tA British Overseas Territory. Saint Helena, Ascension and Tristan da Cunha is a British Overseas Territory located in the South Atlantic and consisting of the island of Saint Helena, Ascension Island, and the archipelago of Tristan da Cunha. \n" +
                "\tNightingale Island is part of the Nightingale Islands, which also includes islets Middle Island and Stoltenhoff Island. All three of these islands are uninhabited, but are regularly visited for scientific purposes and research. It is one of the only stops for birds in the Atlantic and millions of them visit it annually.\n" +
                "\tTristan da Cunha is described as the most remote inhabited island on earth."
        },
        {
            location: 'Gough Island',
            date: 'April 17th 2026',
            dateStart: '2026-04-17',
            dateEnd: '2026-04-17',
            description: 'A British Overseas Territory. It is a dependency of Tristan da Cunha and part of the British overseas territory of Saint Helena, Ascension and Tristan da Cunha.'
        },
        {
            location: 'St. Helena',
            date: 'April 21st-24th 2026',
            dateStart: '2026-04-21',
            dateEnd: '2026-04-24',
            description: 'A British Overseas Territory. Saint Helena, Ascension and Tristan da Cunha is a British Overseas Territory located in the South Atlantic and consisting of the island of Saint Helena, Ascension Island, and the archipelago of Tristan da Cunha '
        },
        {
            location: 'Ascension',
            date: 'April 27th 2026',
            dateStart: '2026-04-27',
            dateEnd: '2026-04-27',
            description: 'A British Oversease Territory. Saint Helena, Ascension and Tristan da Cunha is a British Overseas Territory located in the South Atlantic and consisting of the island of Saint Helena, Ascension Island, and the archipelago of Tristan da Cunha '
        },
        {
            location: 'Cape Verde',
            date: 'May 3rd-6th 2026',
            dateStart: '2026-05-03',
            dateEnd: '2026-05-06',
            description: '(Cabo Verde) The ship was originally scheduled to end in Praia, Cape Verde, on 4 May. '
        },
        {location: 'Tenerife, Canary Islands', date: 'May 10th 2026', dateStart: '2026-05-10', dateEnd: '2026-05-10', description: 'Port of Granadilla'},
    ]

    const transfers = [
        {from: 'Tenerife, Canary Islands', to: 'Netherlands', date: 'May 11th 2026', cases: 54},
        {from: 'Tenerife, Canary Islands', to: 'United Kingdom', date: 'May 11th 2026', cases: 22},
        {from: 'Tenerife, Canary Islands', to: 'United States', date: 'May 11th 2026', cases: 18},
        {from: 'Tenerife, Canary Islands', to: 'Spain', date: 'May 11th 2026', cases: 14},
        {from: 'Tenerife, Canary Islands', to: 'France', date: 'May 11th 2026', cases: 5},
        {from: 'Tenerife, Canary Islands', to: 'Canada', date: 'May 11th 2026', cases: 4},
        {from: 'Tenerife, Canary Islands', to: 'Turkey', date: 'May 11th 2026', cases: 3},
        {from: 'Tenerife, Canary Islands', to: 'Ireland', date: 'May 11th 2026', cases: 2},
    ]

    const significantEventsData = [
        {
            marker: 1,
            location: 'Ushuaia Argentina',
            date: 'April 1st 2026',
            dateStart: '2026-04-01',
            description: 'The MV Hondius, a Dutch cruise vessel, departed from Ushuaia, Argentina and followed an itinerary across the South Atlantic, with multiple stops in remote and ecologically diverse regions. The extent of passenger contact with local wildlife during the voyage, or prior to boarding remains undetermined. The vessel carried a total of 175 individuals, including 114 passengers and 61 crew members.'
        },
        {
            marker: 2,
            location: '%ship-04-11',
            date: 'April 11th 2026',
            dateStart: '2026-04-11',
            description: 'Case 1 (Gh_ID1), a 70 year old Dutch male (index case), developed symptoms of fever, headache, and diarrhea on April 6. His condition worsened and he developed respiratory distress and died on April 11. No microbiological tests were performed and he is considered a probable case. His body was removed from the ship in Saint Helena on April 24.'
        },
        {
            marker: 3,
            location: 'Tristan da Cunha',
            date: 'April 14th 2026',
            dateStart: '2026-04-14',
            description: 'Case 8 (Gh_ID12), an adult male, disembarked the ship in Tristan da Cunha on April 14. He reported onset of symptoms on April 28 with diarrhea, and fever later on. He is considered a probable case until laboratory confirmation. '
        },
        {
            marker: 4,
            location: 'St. Helena',
            date: 'April 24th 2026',
            dateStart: '2026-04-24',
            description: 'Thirty-two passengers disembarked the ship in Saint Helena, including the following known nationalities: United Kingdom (7), United States (6), Netherlands (3), Canada (2), Switzerland (2), Turkey (2), Germany (1), Denmark (1), St. Kitts and Nevis (1), New Zealand (1), Singapore (1), Sweden (1), Unknown (4).'
        },
        {
            marker: 5,
            location: 'Johannesburg, South Africa',
            date: 'April 25th 2026',
            dateStart: '2026-04-25',
            description: 'Case 2 (Gh_ID2) is a 69 year old Dutch female and wife of Case 1. She disembarked the ship in Saint Helena on April 24 with gastrointestinal symptoms and flew to Johannesburg, South Africa.  Her condition worsened during travel. She boarded a connecting flight to Europe, but was too ill to take her scheduled flight and was taken off the plane in Johannesburg and died upon arrival at the emergency department. PCR testing confirmed hantavirus infection.'
        },
        {
            marker: 6,
            location: 'Johannesburg, South Africa',
            date: 'May 2nd 2026',
            dateStart: '2026-05-02',
            description: 'Case 2 (Gh_ID2) is a 69 year old Dutch female and wife of Case 1. She disembarked the ship in Saint Helena on April 24 with gastrointestinal symptoms and flew to Johannesburg, South Africa.  Her condition worsened during travel. She boarded a connecting flight to Europe, but was too ill to take her scheduled flight and was taken off the plane in Johannesburg and died upon arrival at the emergency department. PCR testing confirmed hantavirus infection.',
            popupAnchor: 'top'
        },
        {
            marker: 7,
            location: '%ship-05-02',
            date: 'May 2nd 2026',
            dateStart: '2026-05-02',
            description: 'Case 4 (Gh_ID4) an adult female of German nationality, presented with fever and general malaise on April 28. Her condition worsened. She developed pneumonia and died on May 2. Post-morten sampling confirmed Andes virus.'
        },
        {
            marker: 8,
            location: 'Zurich, Switzerland',
            date: 'May 5th 2026',
            dateStart: '2026-05-05',
            description: 'Case 7 (Gh_ID5), an adult male of Swiss nationality, disembarked the ship in Saint Helena on April 22. He flew back to Switzerland on April 27-28 through South Africa and Qatar. He developed symptoms on May 1 after arrival in Switzerland and was hospitalized in isolation. PCR testing confirmed Andes virus on May 5.'
        },
        {
            marker: 9,
            location: 'Praia, Cape Verde',
            date: 'May 6th 2026',
            dateStart: '2026-05-06',
            description: 'The ship anchored off the coast of Cape Verde on May 3.  Medical staff embarked the vessel. Three suspected cases were taken off the ship and transferred to the Netherlands for care on May 6.  The ship was given permission to proceed to Tenerife, Canary Islands, Spain, for all passengers to disembark and be repatriated to their home countries.'
        },
        {
            marker: 10,
            location: 'Praia, Cape Verde',
            date: 'May 6th 2026',
            dateStart: '2026-05-06',
            description: 'Case 5 (Gh_ID7), an adult male, working as the ship doctor, reported onset of symptoms on April 30, including fever, fatigue, muscle pain and mild respiratory symptoms. He was one of three suspected cases removed from the ship in Cape Verde. PCR testing confirmed Andes virus on May 6 and he was medically evacuated to the Netherlands.'
        },
        {
            marker: 11,
            location: 'Praia, Cape Verde',
            date: 'May 6th 2026',
            dateStart: '2026-05-06',
            description: 'Case 6 (Gh_ID8) is an adult male working as the ship expedition guide, and presented symptoms on April 27 including mild respiratory and gastrointestinal symptoms. PCR testing confirmed Andes virus on May 6. He was one of three suspected cases removed from the ship in Cape Verde. He was medically evacuated to the Netherlands on May 7.'
        },
        {
            marker: 12,
            location: 'Tenerife, Canary Islands',
            date: 'May 10th 2026',
            dateStart: '2026-05-10',
            description: 'The MV Hondius arrived in the Canary Islands and was anchored off the coast at the Port of Granadilla in Tenerife. A total of 122 people (87 guests, 35 crew) disembarked and were repatriated to their home countries. Twenty-seven people (25 crew, 2 medical staff) remained onboard to return the vessel to Rotterdam, the Netherlands. The ship departed from Tenerife on May 11 with a provisional date of arrival in Rotterdam on May 18.'
        },
        {
            marker: 13,
            location: 'Nebraska, US',
            date: 'May 10th 2026',
            dateStart: '2026-05-10',
            description: 'Gh_ID16 is an adult male from the US. He initially tested "faintly" positive during medical evaluation in Tenerife on May 10 and was considered positive out of an abundance of caution, but further testing was negative. He was evacuated to the US and is quarantined with other American passengers from the ship in Nebraska. This case has been removed as a confirmed case from official counts.'
        },
        {
            marker: 14,
            location: 'Paris, France',
            date: 'May 11th 2026',
            dateStart: '2026-05-11',
            description: 'Gh_ID15, a French female, developed symptoms during the evacuation flight from Tenerife to Paris on May 10. Her symptoms worsened and she tested positive for hantavirus on May 11. She was reportedly in critical condition at a Paris hospital on May 13.'
        },
        {
            marker: 15,
            location: 'Madrid, Spain',
            date: 'May 12th 2026',
            dateStart: '2026-05-12',
            description: 'Gh_ID18 is a Spanish citizen who tested provisionally positive after disembarking from the ship in Tenerife on May 11 and was evacuated to Spain. The patient developed symptoms on May 12, was officially confirmed as positive, and is quarantined at a hospital in Madrid.'
        },
        {
            marker: 16,
            location: 'Vancouver Island, British Columbia, Canada',
            date: 'May 17th 2026',
            dateStart: '2026-05-17',
            description: 'Gh_ID20 is a Canadian citizen who was confirmed positive for Andes hantavirus on May 17 following a presumptive positive test result the day prior. The patient was transported to hospital in Vancouver for care on May 14, along with their spouse, who also had mild symptoms but tested negative. The couple were passengers on the MV Hondius.'
        },
    ]


    useEffect(() => {
        if (!map || !mapLoaded || !dataFeatureSet) return;

        // Check if source route already exists (in case of re-render), if not add it and the layer
        if (!map.getSource('paths')) {

            const traceDataDestinations: any = {}
            for (const entry of pathData) {
                if (entry.travel_to && entry.travel_to != 'NA' && ((entry.travel_from && entry.travel_from != 'NA') || (entry.left_location && entry.left_location != 'NA'))) {
                    if (!traceDataDestinations[entry.travel_to]) {
                        traceDataDestinations[entry.travel_to] = [entry.status];
                    } else if (!traceDataDestinations[entry.travel_to].includes(entry.status)) {
                        traceDataDestinations[entry.travel_to].push(entry.status);
                    }
                }
            }

            // Add destination markers


            map.addSource('paths', {
                'type': 'geojson',
                'data': {
                    'type': 'FeatureCollection',
                    'features': pathData.map((pd: any) => {

                        let coordinates = []
                        if (pd.travel_from && locationNameToLongLat[pd.travel_from]) {
                            coordinates.push([locationNameToLongLat[pd.travel_from].long, locationNameToLongLat[pd.travel_from].lat])
                        }
                        if (pd.left_location && locationNameToLongLat[pd.left_location]) {

                            coordinates.push([locationNameToLongLat[pd.left_location].long, locationNameToLongLat[pd.left_location].lat])
                        }
                        if (pd.travel_to && locationNameToLongLat[pd.travel_to]) {
                            coordinates.push([locationNameToLongLat[pd.travel_to].long, locationNameToLongLat[pd.travel_to].lat])
                        }
                        if (coordinates.length < 2) coordinates = []; // Need at least 2 points for a line

                        return {
                            'type': 'Feature',
                            'properties': {status: pd.status},
                            'geometry': {
                                'type': 'LineString',
                                'coordinates': coordinates
                            }
                        }
                    }).filter((pd: any[]) => pd.length != 0)
                }
            });
            map.addLayer({
                'id': 'paths',
                'type': 'line',
                'source': 'paths',
                'layout': {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                'paint': {
                    'line-color': [
                        'match',
                        ['get', 'status'],
                        ...Object.entries(statusColors).flatMap(([status, color]) => [status, color]),
                        '#888'
                    ] as unknown as DataDrivenPropertyValueSpecification<string>,
                    'line-width': 4,
                    // 'line-offset': [
                    //     'match',
                    //     ['get', 'status'],
                    //     ...Object.entries(statusColors).flatMap(([status], i) => [status, (i - (Object.keys(statusColors).length - 1) / 2) * 4]),
                    //     0
                    // ]
                }
            });

            const traceDestinationsFeatures = Object.entries(traceDataDestinations)
                .filter(([dest]) => locationNameToLongLat[dest])
                .map(([dest, statuses]) => ({
                    'type': 'Feature' as const,
                    'properties': {
                        'label': dest,
                        'statuses': (statuses as string[]).join(', '),
                    },
                    'geometry': {
                        'type': 'Point' as const,
                        'coordinates': [locationNameToLongLat[dest].long, locationNameToLongLat[dest].lat]
                    }
                }));
            traceDestinationsFeaturesRef.current = traceDestinationsFeatures;

            map.addSource('trace-destinations', {
                'type': 'geojson',
                'data': {
                    'type': 'FeatureCollection',
                    'features': traceDestinationsFeatures
                }
            });
            map.addLayer({
                'id': 'trace-destinations-circle',
                'type': 'circle',
                'source': 'trace-destinations',
                'paint': {
                    'circle-radius': 6,
                    'circle-color': '#454545',
                    'circle-stroke-color': '#ffffff',
                    'circle-stroke-width': 2
                }
            });
            map.addLayer({
                'id': 'trace-destinations-label',
                'type': 'symbol',
                'source': 'trace-destinations',
                'layout': {
                    'text-field': ['get', 'label'],
                    'text-size': 12,
                    'text-offset': [0, 1],
                    'text-anchor': 'top',
                    'text-font': ['Open Sans Regular'],
                },
                'paint': {
                    'text-color': '#454545',
                    'text-halo-color': '#ffffff',
                    'text-halo-width': 2.5
                }
            });

            // Apply initial visibility filter based on overlaysOpen
            const initialVisibleStatuses = Object.entries(overlaysOpen)
                .filter(([key, value]) => key !== 'ship' && value)
                .map(([key]) => key);

            if (initialVisibleStatuses.length === 0) {
                map.setFilter('paths', ['==', ['get', 'status'], '__none__']);
            } else {
                map.setFilter('paths', ['in', ['get', 'status'], ['literal', initialVisibleStatuses]]);
            }

            const initialFiltered = {
                type: 'FeatureCollection' as const,
                features: traceDestinationsFeatures.filter((f) => {
                    const statuses = (f.properties?.statuses || '').split(', ');
                    return statuses.some((s: string) => initialVisibleStatuses.includes(s));
                }),
            };
            (map.getSource('trace-destinations') as any).setData(initialFiltered);
        }
        if (!map.getSource('ship')) {

            const filteredShipPath = shipPath.filter(sp => sp.dateStart <= dateUpTo);

            map.addSource('ship', {
                'type': 'geojson',
                'data': {
                    'type': 'FeatureCollection',
                    'features': [
                        {
                            'type': 'Feature',
                            'properties': {},
                            'geometry': {
                                'type': 'LineString',
                                'coordinates': filteredShipPath.map(sp =>
                                    [locationNameToLongLat[sp.location].long, locationNameToLongLat[sp.location].lat],
                                )
                            }
                        }
                    ]
                }
            });
            map.addLayer({
                'id': 'ship',
                'type': 'line',
                'source': 'ship',
                'layout': {
                    'line-join': 'round',
                    'line-cap': 'butt'
                },
                'paint': {
                    'line-color': '#454545',
                    'line-width': 3,
                    'line-dasharray': [2, 1]
                }
            });

            // Ship route markers
            map.addSource('ship-stops', {
                'type': 'geojson',
                'data': {
                    'type': 'FeatureCollection',
                    'features': filteredShipPath.map(sp => ({
                        'type': 'Feature' as const,
                        'properties': {
                            'label': `${sp.location.startsWith('%') ? '' : `${sp.location}\n`}${sp.date}`,
                            'location': sp.location,
                            'date': sp.date,
                            'description': sp.description,
                        },
                        'geometry': {
                            'type': 'Point' as const,
                            'coordinates': [locationNameToLongLat[sp.location].long, locationNameToLongLat[sp.location].lat]
                        }
                    }))
                }
            });
            map.addLayer({
                'id': 'ship-stops-circle',
                'type': 'circle',
                'source': 'ship-stops',
                'paint': {
                    'circle-radius': 6,
                    'circle-color': '#454545',
                    'circle-stroke-color': '#ffffff',
                    'circle-stroke-width': 2
                }
            });
            map.addLayer({
                'id': 'ship-stops-label',
                'type': 'symbol',
                'source': 'ship-stops',
                'layout': {
                    'text-field': ['get', 'label'],
                    'text-size': 14,
                    'text-offset': [0, 1],
                    'text-anchor': 'top',
                    'text-font': ['Open Sans Regular'],
                },
                'paint': {
                    'text-color': '#454545',
                    'text-halo-color': '#ffffff',
                    'text-halo-width': 2.5
                }
            });
        }

        if (!map.getSource('transfers')) {
            map.addSource('transfers', {
                'type': 'geojson',
                'data': {
                    'type': 'FeatureCollection',
                    'features': transfers
                        .filter(t => locationNameToLongLat[t.from] && locationNameToLongLat[t.to])
                        .map(t => ({
                            'type': 'Feature' as const,
                            'properties': {
                                'passengers': t.cases,
                                'label': `${t.cases} passengers`,
                            },
                            'geometry': {
                                'type': 'LineString' as const,
                                'coordinates': [
                                    [locationNameToLongLat[t.from].long, locationNameToLongLat[t.from].lat],
                                    [locationNameToLongLat[t.to].long, locationNameToLongLat[t.to].lat],
                                ]
                            }
                        }))
                }
            });
            map.addLayer({
                'id': 'transfers-line',
                'type': 'line',
                'source': 'transfers',
                'layout': {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                'paint': {
                    'line-color': statusColors.probable,
                    'line-width': ['+', 2, ['*', ['get', 'passengers'], 0.08]],
                    'line-opacity': 1
                }
            });

            // Create arrow image for transfers
            if (!map.hasImage('arrow')) {
                const size = 20;
                const canvas = document.createElement('canvas');
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d')!;
                ctx.fillStyle = statusColors.probable;
                ctx.beginPath();
                ctx.moveTo(2, 4);
                ctx.lineTo(size - 2, size / 2);
                ctx.lineTo(2, size - 4);
                ctx.closePath();
                ctx.fill();
                const imageData = ctx.getImageData(0, 0, size, size);
                map.addImage('arrow', {width: size, height: size, data: new Uint8Array(imageData.data.buffer)});
            }

            // Arrowhead symbols along transfer lines
            map.addLayer({
                'id': 'transfers-arrow',
                'type': 'symbol',
                'source': 'transfers',
                'layout': {
                    'symbol-placement': 'line',
                    'symbol-spacing': 60,
                    'icon-image': 'arrow',
                    'icon-size': 1,
                    'icon-rotation-alignment': 'map',
                    'icon-allow-overlap': true,
                    'icon-ignore-placement': true,
                },
            });

            // Labels showing case count at midpoint
            map.addLayer({
                'id': 'transfers-label',
                'type': 'symbol',
                'source': 'transfers',
                'layout': {
                    'symbol-placement': 'line-center',
                    'text-field': ['concat', ['to-string', ['get', 'passengers']], ' passengers'],
                    'text-size': 14,
                    'text-font': ['Open Sans Regular'],
                    'text-allow-overlap': false,
                },
                'paint': {
                    'text-color': '#454545',
                    'text-halo-color': '#ffffff',
                    'text-halo-width': 1.5
                }
            });
        }

        if (!map.getSource('significant-events')) {
            const filteredEvents = significantEventsData
                .filter(e => locationNameToLongLat[e.location] && e.dateStart <= dateUpTo);
            map.addSource('significant-events', {
                'type': 'geojson',
                'data': {
                    'type': 'FeatureCollection',
                    'features': filteredEvents
                        .map(e => ({
                            'type': 'Feature' as const,
                            'properties': {
                                'label': `${e.location.startsWith('%') ? '' : `${e.location}\n`}${e.date}`,
                                'description': e.description,
                                'date': e.date,
                                'location': e.location,
                                'popupAnchor': e.popupAnchor || 'bottom',
                            },
                            'geometry': {
                                'type': 'Point' as const,
                                'coordinates': [locationNameToLongLat[e.location].long, locationNameToLongLat[e.location].lat]
                            }
                        }))
                }
            });
            map.addLayer({
                'id': 'significant-events-circle',
                'type': 'circle',
                'source': 'significant-events',
                'paint': {
                    'circle-radius': 8,
                    'circle-color': statusColors['confirmed'] || '#FFA500',
                    'circle-stroke-color': '#ffffff',
                    'circle-stroke-width': 2
                }
            });
            map.addLayer({
                'id': 'significant-events-label',
                'type': 'symbol',
                'source': 'significant-events',
                'layout': {
                    'text-field': ['get', 'label'],
                    'text-size': 14,
                    'text-offset': [0, 1.5],
                    'text-anchor': 'top',
                    'text-font': ['Open Sans Regular'],
                    'text-max-width': 18,
                },
                'paint': {
                    'text-color': statusColors.confirmed,
                    'text-halo-color': '#ffffff',
                    'text-halo-width': 2
                }
            });

            // Ship stops hover popup
            map.on('mouseenter', 'significant-events-circle', (e) => {
                map.getCanvas().style.cursor = 'pointer';
                if (!e.features || !e.features[0]) return;

                const coordinates = (e.features[0].geometry as GeoJSON.Point).coordinates.slice() as [number, number];
                const popupAnchor = e.features[0].properties?.popupAnchor || 'bottom';

                // Query all features at this point to show multiple events at the same location
                const allFeatures = map.queryRenderedFeatures(e.point, { layers: ['significant-events-circle'] });

                let html = '<div style="min-width:250px;max-height:400px;overflow-y:auto;font-size:14px;white-space:pre-wrap;padding:10px;">';
                const location = allFeatures[0]?.properties?.location || '';
                if (!location.startsWith('%')) {
                    html += `<p style="font-size:18px;font-weight:bold;margin-bottom:6px;">${location}</p>`;
                }
                allFeatures.forEach((f, i) => {
                    const date = f.properties?.date || '';
                    const description = f.properties?.description || '';
                    if (i > 0) html += '<hr style="border:none;border-top:1px solid #ddd;margin:10px 0;">';
                    html += `<p style="font-weight:500;margin-bottom:6px;color:#1e1e1e">${date}</p><p style="color:#454545">${description}</p>`;
                });
                html += '</div>';

                const popup = new Popup({
                    closeButton: false,
                    closeOnClick: false,
                    anchor: popupAnchor,
                    offset: 10,
                })
                    .setLngLat(coordinates)
                    .setHTML(html)
                    .addTo(map);

                (map as any)._significantEventPopup = popup;
            });

            map.on('mouseleave', 'significant-events-circle', () => {
                map.getCanvas().style.cursor = '';
                if ((map as any)._significantEventPopup) {
                    (map as any)._significantEventPopup.remove();
                    (map as any)._significantEventPopup = null;
                }
            });
        }


        const setupLayer = async () => {
            try {
                // Only load boundaries for the current admin level and for areas with case storage
                const boundaries: FeatureCollection = {
                    type: 'FeatureCollection',
                    features: data.map((d) => ({
                        type: 'Feature',
                        geometry: d.geometry as any,
                        properties: {
                            shapeGroup: d.countryCode,
                            shapeName: d.name,
                            shapeType: `ADM${adminLevel}`,
                        },
                    })),
                };

                // Join case storage into boundary features by matching name and country code
                const joinedFeatures: Feature[] = boundaries.features.map(
                    (feature) => {
                        const props = feature.properties || {};
                        // geoBoundaries uses shapeGroup (ISO3) and shapeName
                        const shapeName = props.shapeName;
                        const shapeGroup = props.shapeGroup;

                        // Find matching storage entry by name (case-insensitive)
                        const matchedData = data.find(
                            (
                                d:
                                    | CountryData
                                    | StateData
                                    | RegionalData,
                            ) => {
                                if (adminLevel === 0) {
                                    // For countries, match by ISO code if available
                                    return (
                                        d.countryCode?.toUpperCase() ===
                                        shapeGroup?.toUpperCase()
                                    );
                                }
                                // For sub-national, match by name within the same country
                                return (
                                    d.name?.toLowerCase() ===
                                    shapeName?.toLowerCase() &&
                                    d.countryCode?.toUpperCase() ===
                                    shapeGroup?.toUpperCase()
                                );
                            },
                        );

                        const newProps: Record<string, any> = {
                            ...props,
                            areaName: matchedData
                                ? matchedData.name
                                : shapeName,
                            countryCode: shapeGroup,
                            areaId: matchedData?.areaId || props.shapeID,
                        };

                        if (matchedData) {
                            newProps.caseCount = matchedData.caseCount;
                            newProps.lat = matchedData.lat;
                            newProps.long = matchedData.long;
                        }

                        return {
                            ...feature,
                            properties: newProps,
                        };
                    },
                );

                const joinedGeoJSON: FeatureCollection = {
                    type: 'FeatureCollection',
                    features: joinedFeatures,
                };

                const sourceId = `admin${adminLevel}Source`;

                if (map.getSource(sourceId)) {
                    (map.getSource(sourceId) as any).setData(joinedGeoJSON);
                } else {
                    map.addSource(sourceId, {
                        type: 'geojson',
                        data: joinedGeoJSON,
                        promoteId: 'shapeID',
                    });
                }

                // Remove popup if it was opened
                if (currentPopup) currentPopup.remove();

                // Find the first symbol (label) layer so we insert below it
                const firstSymbolLayer = map
                    .getStyle()
                    .layers?.find((layer) => layer.type === 'symbol')?.id;

                if (!map.getLayer(`admin${adminLevel}Join`)) {
                    map.addLayer(
                        {
                            id: `admin${adminLevel}Join`,
                            type: 'fill',
                            source: sourceId,
                            paint: {
                                'fill-color': [
                                    'case',
                                    ['has', 'caseCount'],
                                    [
                                        'case',
                                        ['==', ['get', 'caseCount'], 0],
                                        ChoroplethMapColors.empty,
                                        [
                                            '<=',
                                            ['get', 'caseCount'],
                                            dataLayerBounds.level1.upper.number,
                                        ],
                                        ChoroplethMapColors.level1,
                                        [
                                            '<=',
                                            ['get', 'caseCount'],
                                            dataLayerBounds.level2.upper.number,
                                        ],
                                        ChoroplethMapColors.level2,
                                        [
                                            '<=',
                                            ['get', 'caseCount'],
                                            dataLayerBounds.level3.upper.number,
                                        ],
                                        ChoroplethMapColors.level3,
                                        [
                                            '<=',
                                            ['get', 'caseCount'],
                                            dataLayerBounds.level4.upper.number,
                                        ],
                                        ChoroplethMapColors.level4,
                                        [
                                            '<=',
                                            ['get', 'caseCount'],
                                            dataLayerBounds.level5.upper.number,
                                        ],
                                        ChoroplethMapColors.level5,
                                        [
                                            '>',
                                            ['get', 'caseCount'],
                                            dataLayerBounds.level5.upper.number,
                                        ],
                                        ChoroplethMapColors.level6,
                                        ChoroplethMapColors.empty,
                                    ],
                                    ChoroplethMapColors.empty,
                                ],
                            },
                        },
                        firstSymbolLayer,
                    );
                }

                if (!map.getLayer(`admin${adminLevel}JoinBorder`)) {
                    map.addLayer(
                        {
                            id: `admin${adminLevel}JoinBorder`,
                            type: 'line',
                            source: sourceId,
                            paint: {
                                'line-color': [
                                    'case',
                                    ['has', 'caseCount'],
                                    [
                                        'case',
                                        ['==', ['get', 'caseCount'], 0],
                                        ChoroplethMapColors['empty'],
                                        ['>', ['get', 'caseCount'], 0],
                                        ChoroplethMapColors['borders'],
                                        ChoroplethMapColors['empty'],
                                    ],
                                    ChoroplethMapColors['empty'],
                                ],
                            },
                        },
                        firstSymbolLayer,
                    );
                }

                // Click handler
                map.on('click', `admin${adminLevel}Join`, (e) => {
                    if (!e.features || !e.features[0].properties?.areaName) {
                        dispatch(setFocusedArea(null));
                        return;
                    }

                    const name = e.features[0].properties.areaName;
                    const areaId = e.features[0].properties.areaId || '';
                    const countryCode = e.features[0].properties.countryCode;

                    dispatch(setFocusedArea({name, areaId, countryCode}));
                });

                // Cursor pointer on hover
                map.on('mousemove', `admin${adminLevel}Join`, (e) => {
                    if (e.features?.[0]?.properties?.caseCount != null)
                        map.getCanvas().style.cursor = 'pointer';
                    else map.getCanvas().style.cursor = '';
                });

                map.on('mouseleave', `admin${adminLevel}Join`, () => {
                    map.getCanvas().style.cursor = '';
                });

                setMapLoaded(true);
            } catch (error) {
                console.error('Failed to load geoBoundaries:', error);
            }
        };

        setupLayer();
    }, [mapLoaded, dataFeatureSet]);

    // Update ship path when dateUpTo changes
    useEffect(() => {
        if (!map || !map.getSource('ship') || !map.getSource('ship-stops')) return;

        const filteredShipPath = shipPath.filter(sp => sp.dateStart <= dateUpTo);

        (map.getSource('ship') as any).setData({
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: filteredShipPath.map(sp =>
                            [locationNameToLongLat[sp.location].long, locationNameToLongLat[sp.location].lat],
                        )
                    }
                }
            ]
        });

        (map.getSource('ship-stops') as any).setData({
            type: 'FeatureCollection',
            features: filteredShipPath.map(sp => ({
                type: 'Feature' as const,
                properties: {
                    label: `${sp.location.startsWith('%') ? '' : `${sp.location}\n`}${sp.date}`,
                    location: sp.location,
                    date: sp.date,
                    description: sp.description,
                },
                geometry: {
                    type: 'Point' as const,
                    coordinates: [locationNameToLongLat[sp.location].long, locationNameToLongLat[sp.location].lat]
                }
            }))
        });

        // Update significant events
        if (map.getSource('significant-events')) {
            const filteredEvents = significantEventsData
                .filter(e => locationNameToLongLat[e.location] && e.dateStart <= dateUpTo);
            (map.getSource('significant-events') as any).setData({
                type: 'FeatureCollection',
                features: filteredEvents.map(e => ({
                    type: 'Feature' as const,
                    properties: {
                        label: `${e.location.startsWith('%') ? '' : `${e.location}\n`}${e.date}`,
                        description: e.description,
                        date: e.date,
                        location: e.location,
                    },
                    geometry: {
                        type: 'Point' as const,
                        coordinates: [locationNameToLongLat[e.location].long, locationNameToLongLat[e.location].lat]
                    }
                }))
            });
        }
    }, [dateUpTo, map]);

    // Toggle ship overlay visibility
    useEffect(() => {
        if (!map) return;
        const visibility = overlaysOpen['ship'] ? 'visible' : 'none';
        ['ship', 'ship-stops-circle', 'ship-stops-label'].forEach(layerId => {
            if (map.getLayer(layerId)) {
                map.setLayoutProperty(layerId, 'visibility', visibility);
            }
        });
    }, [overlaysOpen['ship'], map]);

    // Toggle tenerifeDepartures (transfers) overlay visibility
    useEffect(() => {
        if (!map) return;
        const visibility = overlaysOpen['tenerifeDepartures'] ? 'visible' : 'none';
        ['transfers-line', 'transfers-arrow', 'transfers-label'].forEach(layerId => {
            if (map.getLayer(layerId)) {
                map.setLayoutProperty(layerId, 'visibility', visibility);
            }
        });
    }, [overlaysOpen['tenerifeDepartures'], map]);

    // Toggle significant events overlay visibility
    useEffect(() => {
        if (!map) return;
        const visibility = overlaysOpen['significantEvents'] ? 'visible' : 'none';
        ['significant-events-circle', 'significant-events-label'].forEach(layerId => {
            if (map.getLayer(layerId)) {
                map.setLayoutProperty(layerId, 'visibility', visibility);
            }
        });
    }, [overlaysOpen['significantEvents'], map]);

    // Toggle paths and trace-destinations visibility based on status
    useEffect(() => {
        if (!map || !map.getSource('paths')) return;
        const visibleStatuses = Object.entries(overlaysOpen)
            .filter(([key, value]) => key !== 'ship' && value)
            .map(([key]) => key);

        if (visibleStatuses.length === 0) {
            map.setFilter('paths', ['==', ['get', 'status'], '__none__']);
        } else {
            map.setFilter('paths', ['in', ['get', 'status'], ['literal', visibleStatuses]]);
        }

        // Filter trace-destination markers: show only if at least one of their statuses is visible
        if (map.getSource('trace-destinations')) {
            const filtered = {
                type: 'FeatureCollection' as const,
                features: traceDestinationsFeaturesRef.current.filter((f) => {
                    const statuses = (f.properties?.statuses || '').split(', ');
                    return statuses.some((s: string) => visibleStatuses.includes(s));
                }),
            };
            (map.getSource('trace-destinations') as any).setData(filtered);
        }
    }, [overlaysOpen, map]);

    // Fly to country
    useEffect(() => {
        if (!focusedArea) {
            currentPopup?.remove();
            setCurrentPopup(null);
            return;
        }

        const areaId = focusedArea.areaId;

        const foundArea = data.find(
            (rd: CountryData | StateData | RegionalData) =>
                rd.areaId === areaId,
        );

        if (foundArea) {
            const foundAreaData:
                | CountryData
                | StateData
                | RegionalData
                | undefined = data.find(
                (rd: CountryData | StateData | RegionalData) =>
                    rd.areaId === areaId,
            );
            if (!foundAreaData) return;
            const bounds = foundArea.bounds;
            const lastUploadDate = convertStringDateToDate(
                foundAreaData.lastUpdated,
            );
            const popupTitle = foundArea.name;

            map?.fitBounds(bounds, {padding: 250});

            const popupContent = (
                <PopupContentText>
                    {foundAreaData.caseCount.toLocaleString()} confirmed case
                    {foundAreaData.caseCount > 1 ? 's' : ''}
                </PopupContentText>
            );

            const popupElement = document.createElement('div');
            ReactDOM.render(
                <MapPopup
                    title={popupTitle}
                    content={popupContent}
                    lastUploadDate={lastUploadDate}
                />,
                popupElement,
            );

            if (map) {
                if (!currentPopup) {
                    const popup = new Popup({
                        anchor: smallScreen ? 'center' : undefined,
                        closeButton: false,
                        closeOnClick: true,
                    })
                        .setLngLat([foundArea.long, foundArea.lat])
                        .setDOMContent(popupElement)
                        .addTo(map);

                    popup.on('close', () => {
                        dispatch(setFocusedArea(null));
                        setCurrentPopup(null);
                    });

                    setCurrentPopup(popup);
                } else {
                    currentPopup
                        .setLngLat([foundArea.long, foundArea.lat])
                        .setDOMContent(popupElement);
                }
            }
        } else {
            if (currentPopup) currentPopup.remove();
            map?.fitBounds([0, -12.4, 0, 70.15]);
        }
    }, [focusedArea]);
};
