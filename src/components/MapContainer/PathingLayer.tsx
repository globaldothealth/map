import ReactDOM from 'react-dom';
import React, { useEffect, useRef, useState } from 'react';
import { ActionCreatorWithPayload } from '@reduxjs/toolkit';
import { Feature, FeatureCollection } from 'geojson';
import { Map, Popup } from 'maplibre-gl';
import useMediaQuery from '@mui/material/useMediaQuery';

import MapPopup from 'src/components/MapPopup';
import { PopupContentText } from 'src/components/MapPopup/styled';
import { ChoroplethMapColors } from 'src/models/Colors';
import { CountryData } from 'src/models/CountryData';
import { FocusedArea } from 'src/models/FocusedArea';
import { RegionalData } from 'src/models/RegionalData';
import { StateData } from 'src/models/StateData';
import { useAppDispatch } from 'src/redux/hooks';
import { convertStringDateToDate } from 'src/utils/helperFunctions';

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
) => {
    const dispatch = useAppDispatch();
    const smallScreen = useMediaQuery('(max-width:1400px)');
    const [currentPopup, setCurrentPopup] = useState<Popup | null>();
    const traceDestinationsFeaturesRef = useRef<any[]>([]);

    // Constants
    const locationNameToLongLat: Record<string, { long: number; lat: number }> = {
        "St. Helena": { long: -5.70, lat: -15.95 },
        "Ascension": { long: -14.25, lat: -7.95 },
        "Canary Islands": { long: -15.50, lat: 28.25 },
        "Buenos Aires, Argentina": { long: -58.3816, lat: -34.6037 },
        "Johannesburg, South Africa": { long: 28.0473, lat: -26.2041 },
        "South Africa": { long: 22.9375, lat: -30.5595 },
        "Zurich, Switzerland": { long: 8.5417, lat: 47.3769 },
        "Amsterdam, Netherlands": { long: 4.9041, lat: 52.3676 },
        "Netherlands": { long: 5.2913, lat: 52.1326 },
        "Netherlands (arrived 2026-05-07)": { long: 5.2913, lat: 52.1326 },
        "Netherlands, then Dusseldorf, Germany": { long: 6.7735, lat: 51.2277 },
        "Singapore": { long: 103.8198, lat: 1.3521 },
        "Paris, France": { long: 2.3522, lat: 48.8566 },
        "Nebraska": { long: -99.9018, lat: 41.4925 },
        "Rome, Italy": { long: 12.4964, lat: 41.9028 },
        "Ushuaia Argentina": { long: -68.3059, lat: -54.8019 },
        "Tristan de Cunha": { long: -58.4333, lat: -37.1052 },
        "Praia, Cape Verde": { long: -23.5087, lat: 14.9330 },
        "Tenerife, Canary Islands": { long: -16.6291, lat: 28.2916 },
        "Cape Verde": { long: -24.0, lat: 16.0 },
        "Tenerife": { long: -16.6291, lat: 28.2916 },
    }
    const shipPath = [
        {location: 'Ushuaia Argentina', date: 'April 1st 2026'},
        {location: 'Tristan de Cunha', date: 'April 13th-16th 2026'},
        {location: 'St. Helena', date: 'April 24th 2026'},
        {location: 'Ascension', date: 'April 27th 2026'},
        {location: 'Praia, Cape Verde', date: 'May 6th 2026'},
        {location: 'Tenerife, Canary Islands', date: 'May 10th 2026'},
        ]


    useEffect(() => {
        if (!map || !mapLoaded || !dataFeatureSet) return;

        // Check if source route already exists (in case of re-render), if not add it and the layer
        if(!map.getSource('paths')) {

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
                        if (coordinates.length < 2) coordinates =  []; // Need at least 2 points for a line

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
                    ],
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
        if(!map.getSource('ship')) {

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
                                'coordinates': shipPath.map(sp =>
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
                    'features': shipPath.map(sp => ({
                        'type': 'Feature' as const,
                        'properties': {
                            'label': `${sp.location}\n${sp.date}`,
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

                    dispatch(setFocusedArea({ name, areaId, countryCode }));
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

            map?.fitBounds(bounds, { padding: 250 });

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
