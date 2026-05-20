import ReactDOM from 'react-dom';
import React, {useEffect, useState} from 'react';
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
import {
    locationNameToLongLat,
    shipPath,
    significantEventsData,
    transfers
} from "src/components/MapContainer/staticData.ts";

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
    overlaysOpen: { [key: string]: boolean },
    statusColors: { [key: string]: string },
    dateUpTo: string,
) => {
    const dispatch = useAppDispatch();
    const smallScreen = useMediaQuery('(max-width:1400px)');
    const [currentPopup, setCurrentPopup] = useState<Popup | null>();


    const buildSignificantEventsGeoJSON = (events: typeof significantEventsData) => {
        const grouped: Record<string, {
            markers: number[];
            entries: typeof significantEventsData;
            popupAnchor: string
        }> = {};
        for (const e of events) {
            if (!grouped[e.location]) {
                grouped[e.location] = {
                    markers: [],
                    entries: [],
                    popupAnchor: (e as typeof e & { popupAnchor?: string }).popupAnchor || 'bottom'
                };
            }
            grouped[e.location].markers.push(e.marker);
            grouped[e.location].entries.push(e);
        }
        return {
            type: 'FeatureCollection' as const,
            features: Object.entries(grouped).map(([location, group]) => ({
                type: 'Feature' as const,
                properties: {
                    markers: group.markers.join(', '),
                    label: location.startsWith('%') ? '' : location,
                    location,
                    popupAnchor: group.popupAnchor,
                    events: JSON.stringify(group.entries.map(e => ({
                        date: e.date,
                        description: e.description,
                        relatedCaseStatus: e.relatedCaseStatus
                    }))),
                },
                geometry: {
                    type: 'Point' as const,
                    coordinates: [locationNameToLongLat[location].long, locationNameToLongLat[location].lat]
                }
            }))
        };
    };

    useEffect(() => {
        if (!map || !mapLoaded || !dataFeatureSet) return;

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
                    'text-offset': [0, -1],
                    'text-anchor': 'bottom',
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
            const filteredTransfers = transfers.filter(t => t.date <= dateUpTo);
            map.addSource('transfers', {
                'type': 'geojson',
                'data': {
                    'type': 'FeatureCollection',
                    'features': filteredTransfers
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
                    'line-color': statusColors.departures,
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
                ctx.fillStyle = statusColors.departures;
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
                'data': buildSignificantEventsGeoJSON(filteredEvents)
            });
            map.addLayer({
                'id': 'significant-events-circle',
                'type': 'circle',
                'source': 'significant-events',
                'paint': {
                    'circle-radius': 8,
                    'circle-color': statusColors.events || '#FFA500',
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
                    'text-color': statusColors.events,
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
                const location = e.features[0].properties?.location || '';
                const eventsRaw = e.features[0].properties?.events || '[]';
                const events: {
                    date: string;
                    description: string,
                    relatedCaseStatus: string
                }[] = JSON.parse(eventsRaw);

                let html = '<div style="min-width:250px;max-height:400px;overflow-y:auto;font-size:14px;white-space:pre-wrap;padding:10px;">';
                if (!location.startsWith('%')) {
                    html += `<p style="font-size:18px;font-weight:bold;margin-bottom:6px;">${location}</p>`;
                }
                events.forEach((ev, i) => {
                    if (i > 0) html += '<hr style="border:none;border-top:1px solid #ddd;margin:10px 0;">';
                    html += `<p style="font-weight:500;margin-bottom:6px;color:#1e1e1e">${ev.date}${ev.relatedCaseStatus ? ' - ' + ev.relatedCaseStatus + ' Case' : ""}</p><p style="color:#454545">${ev.description}</p>`;
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

        // Update transfers
        if (map.getSource('transfers')) {
            const filteredTransfers = transfers.filter(t => t.date <= dateUpTo);
            (map.getSource('transfers') as any).setData({
                type: 'FeatureCollection',
                features: filteredTransfers
                    .filter(t => locationNameToLongLat[t.from] && locationNameToLongLat[t.to])
                    .map(t => ({
                        type: 'Feature' as const,
                        properties: {
                            passengers: t.cases,
                            label: `${t.cases} passengers`,
                        },
                        geometry: {
                            type: 'LineString' as const,
                            coordinates: [
                                [locationNameToLongLat[t.from].long, locationNameToLongLat[t.from].lat],
                                [locationNameToLongLat[t.to].long, locationNameToLongLat[t.to].lat],
                            ]
                        }
                    }))
            });
        }

        // Update significant events
        if (map.getSource('significant-events')) {
            const filteredEvents = significantEventsData
                .filter(e => locationNameToLongLat[e.location] && e.dateStart <= dateUpTo);
            (map.getSource('significant-events') as any).setData(buildSignificantEventsGeoJSON(filteredEvents));
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
        ['significant-events-circle', 'significant-events-marker-text', 'significant-events-label'].forEach(layerId => {
            if (map.getLayer(layerId)) {
                map.setLayoutProperty(layerId, 'visibility', visibility);
            }
        });
    }, [overlaysOpen['significantEvents'], map]);

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
                    {foundAreaData.caseCount.toLocaleString()} {foundAreaData.status} case
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
