import { createRoot } from 'react-dom/client';
import React, { useEffect } from 'react';
import { ActionCreatorWithPayload } from '@reduxjs/toolkit';
import { Feature, FeatureCollection } from 'geojson';
import { Map, Popup } from 'maplibre-gl';

import MapPopup from 'src/components/MapPopup';
import { PopupContentText } from 'src/components/MapPopup/styled';
import { ChoroplethMapColors } from 'src/models/Colors';
import { CountryData } from 'src/models/CountryData';
import { FocusedArea } from 'src/models/FocusedArea';
import { RegionalData } from 'src/models/RegionalData';
import { StateData } from 'src/models/StateData';
import { useAppDispatch } from 'src/redux/hooks';
import { convertStringDateToDate } from 'src/utils/helperFunctions';

export const useChoroplethLayer = (
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
    outbreakName: string,
) => {
    const dispatch = useAppDispatch();
    const currentPopupRef = React.useRef<Popup | null>(null);
    const popupRootRef = React.useRef<ReturnType<typeof createRoot> | null>(null);
    const suppressPopupCloseRef = React.useRef(false);
    const handlersRef = React.useRef<{
        click: ((e: any) => void) | null;
        mousemove: ((e: any) => void) | null;
        mouseleave: (() => void) | null;
        clickOther: ((e: any) => void) | null;
        mousemoveOther: ((e: any) => void) | null;
        mouseleaveOther: (() => void) | null;
    }>({ click: null, mousemove: null, mouseleave: null, clickOther: null, mousemoveOther: null, mouseleaveOther: null });
    useEffect(() => {
        // Calculate bounds for all data entries to focus map on content
        if (!map || !mapLoaded || data.length === 0) return;
        const bounds = data.reduce<[number, number, number, number]>(
            (acc, entry) => {
                const [w, s, e, n] = entry.bounds;
                return [
                    Math.min(acc[0], w),
                    Math.min(acc[1], s),
                    Math.max(acc[2], e),
                    Math.max(acc[3], n),
                ];
            },
            [180, 90, -180, -90],
        );
        map.fitBounds(bounds, { padding: 150 });
    }, [map, mapLoaded, data]);

    useEffect(() => {
        if (!map || !mapLoaded || !dataFeatureSet) return;

        let isCancelled = false;

        const setupLayer = async () => {
            try {
                const dataUnion = data as (
                    | CountryData
                    | StateData
                    | RegionalData
                )[];
                // Only load boundaries for the current admin level and for areas with case storage
                const boundaries: FeatureCollection = {
                    type: 'FeatureCollection',
                    features: dataUnion.map((d) => ({
                        type: 'Feature' as const,
                        geometry: d.geometry as any,
                        properties: {
                            shapeGroup: d.countryCode,
                            shapeName: d.name,
                            shapeType: `ADMIN`,
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
                        const matchedData = dataUnion.find((d) => {
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
                        });

                        const areaName = matchedData ? matchedData.name : shapeName;
                        const labelName =
                            areaName?.startsWith('Other (') && areaName?.endsWith(')')
                                ? areaName.slice('Other ('.length, -1)
                                : areaName;

                        const newProps: Record<string, any> = {
                            ...props,
                            areaName,
                            labelName,
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

                const sourceId = `adminSource`;

                // Remove layers before re-adding so they always reflect current adminLevel and data
                const layersToRemove = [
                    'adminJoinLabels',
                    'adminJoinOtherStripe',
                    'adminJoinBorder',
                    'adminJoin',
                    'adminJoinEmpty',
                ];
                for (const layerId of layersToRemove) {
                    if (map.getLayer(layerId)) map.removeLayer(layerId);
                }

                if (map.getSource(sourceId)) {
                    (map.getSource(sourceId) as any).setData(joinedGeoJSON);
                } else {
                    map.addSource(sourceId, {
                        type: 'geojson',
                        data: joinedGeoJSON,
                        promoteId: 'shapeID',
                    });
                }

                // Create per-level stripe patterns (colored stripes on transparent background)
                const stripePatternEntries: [string, string][] = [
                    ['stripe-empty', ChoroplethMapColors.empty],
                    ['stripe-level1', ChoroplethMapColors.level1],
                    ['stripe-level2', ChoroplethMapColors.level2],
                    ['stripe-level3', ChoroplethMapColors.level3],
                    ['stripe-level4', ChoroplethMapColors.level4],
                    ['stripe-level5', ChoroplethMapColors.level5],
                    ['stripe-level6', ChoroplethMapColors.level6],
                ];
                for (const [name, color] of stripePatternEntries) {
                    if (!map.hasImage(name)) {
                        const size = 10;
                        const canvas = document.createElement('canvas');
                        canvas.width = size;
                        canvas.height = size;
                        const ctx = canvas.getContext('2d')!;
                        ctx.clearRect(0, 0, size, size);
                        ctx.strokeStyle = color;
                        ctx.lineWidth = 2;
                        // Main diagonal: bottom-left to top-right
                        ctx.beginPath();
                        ctx.moveTo(0, size);
                        ctx.lineTo(size, 0);
                        ctx.stroke();
                        // Top-left corner continuation (wraps from bottom-right of previous tile)
                        ctx.beginPath();
                        ctx.moveTo(0, 0);
                        ctx.lineTo(0, 0);
                        ctx.moveTo(-size / 2, size / 2);
                        ctx.lineTo(size / 2, -size / 2);
                        ctx.stroke();
                        // Bottom-right corner continuation
                        ctx.beginPath();
                        ctx.moveTo(size / 2, size + size / 2);
                        ctx.lineTo(size + size / 2, size / 2);
                        ctx.stroke();
                        const imageData = ctx.getImageData(0, 0, size, size);
                        map.addImage(name, {
                            width: size,
                            height: size,
                            data: imageData.data as unknown as Uint8Array<ArrayBuffer>,
                        });
                    }
                }

                // Remove popup if it was opened
                if (currentPopupRef.current) {
                    popupRootRef.current?.unmount();
                    popupRootRef.current = null;
                    currentPopupRef.current.remove();
                    currentPopupRef.current = null;
                }

                // Find the first symbol (label) layer so we insert below it
                const firstSymbolLayer = map
                    .getStyle()
                    .layers?.find((layer) => layer.type === 'symbol')?.id;

                const stripePatternExpression = [
                    'case',
                    ['has', 'caseCount'],
                    [
                        'case',
                        ['==', ['get', 'caseCount'], 0],
                        'stripe-empty',
                        ['<=', ['get', 'caseCount'], dataLayerBounds.level1.upper.number],
                        'stripe-level1',
                        ['<=', ['get', 'caseCount'], dataLayerBounds.level2.upper.number],
                        'stripe-level2',
                        ['<=', ['get', 'caseCount'], dataLayerBounds.level3.upper.number],
                        'stripe-level3',
                        ['<=', ['get', 'caseCount'], dataLayerBounds.level4.upper.number],
                        'stripe-level4',
                        ['<=', ['get', 'caseCount'], dataLayerBounds.level5.upper.number],
                        'stripe-level5',
                        'stripe-level6',
                    ],
                    'stripe-empty',
                ];

                map.addLayer(
                        {
                            id: 'adminJoinOtherStripe',
                            type: 'fill',
                            source: sourceId,
                            filter: ['==', ['get', 'areaName'], 'Other (Ituri Province)'],
                            paint: {
                                'fill-pattern': stripePatternExpression,
                            },
                        } as any,
                        firstSymbolLayer,
                    );

                map.addLayer(
                        {
                            id: 'adminJoinEmpty',
                            type: 'fill',
                            source: sourceId,
                            filter: [
                                'all',
                                ['!=', ['get', 'areaName'], 'Other (Ituri Province)'],
                                [
                                    'any',
                                    ['!', ['has', 'caseCount']],
                                    ['==', ['get', 'caseCount'], 0],
                                ],
                            ],
                            paint: {
                                'fill-color': ChoroplethMapColors.empty,
                            },
                        } as any,
                        firstSymbolLayer,
                    );

                map.addLayer(
                        {
                            id: `adminJoin`,
                            type: 'fill',
                            source: sourceId,
                            filter: [
                                'all',
                                ['!=', ['get', 'areaName'], 'Other (Ituri Province)'],
                                ['has', 'caseCount'],
                                ['>', ['get', 'caseCount'], 0],
                            ],
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
                        } as any,
                        firstSymbolLayer,
                    );

                map.addLayer(
                        {
                            id: `adminJoinBorder`,
                            type: 'line',
                            source: sourceId,
                            paint: {
                                'line-color': [
                                    'case',
                                    ['has', 'caseCount'],
                                    [
                                        'case',
                                        ['==', ['get', 'caseCount'], 0],
                                        ChoroplethMapColors['borders'],
                                        ['>', ['get', 'caseCount'], 0],
                                        ChoroplethMapColors['borders'],
                                        ChoroplethMapColors['empty'],
                                    ],
                                    ChoroplethMapColors['empty'],
                                ],
                            },
                        } as any,
                        firstSymbolLayer,
                    );
                console.log('ON',outbreakName)

                if (adminLevel === 2 || adminLevel === 1 && outbreakName === 'EbolaBVD') {
                    map.addLayer(
                        {
                            id: 'adminJoinLabels',
                            type: 'symbol',
                            source: sourceId,
                            layout: {
                                'text-field': ['get', 'labelName'],
                                'text-size': [
                                    'interpolate',
                                    ['linear'],
                                    ['zoom'],
                                    3, 11,
                                    6, 14,
                                    10, 16,
                                ],
                                'text-font': ['Open Sans Regular'],
                                'text-max-width': 8,
                                'text-anchor': 'center',
                                'text-allow-overlap': false,
                                'text-ignore-placement': false,
                            },
                            paint: {
                                'text-color': '#333333',
                                'text-halo-color': '#ffffff',
                                'text-halo-width': 1.5,
                            },
                        } as any,
                        firstSymbolLayer,
                    );
                }



                // Remove previously registered handlers to prevent duplicates
                if (handlersRef.current.click) {
                    map.off('click', 'adminJoin', handlersRef.current.click);
                }
                if (handlersRef.current.mousemove) {
                    map.off('mousemove', 'adminJoin', handlersRef.current.mousemove);
                }
                if (handlersRef.current.mouseleave) {
                    map.off('mouseleave', 'adminJoin', handlersRef.current.mouseleave);
                }
                if (handlersRef.current.clickOther) {
                    map.off('click', 'adminJoinOtherStripe', handlersRef.current.clickOther);
                }
                if (handlersRef.current.mousemoveOther) {
                    map.off('mousemove', 'adminJoinOtherStripe', handlersRef.current.mousemoveOther);
                }
                if (handlersRef.current.mouseleaveOther) {
                    map.off('mouseleave', 'adminJoinOtherStripe', handlersRef.current.mouseleaveOther);
                }

                // Click handler
                const clickHandler = (e: any) => {
                    if (!e.features || !e.features[0].properties?.areaName) {
                        dispatch(setFocusedArea(null));
                        return;
                    }

                    if (e.features[0].properties?.caseCount === 0) return;

                    const name = e.features[0].properties.areaName;
                    const areaId = e.features[0].properties.areaId || '';
                    const countryCode = e.features[0].properties.countryCode;

                    // Suppress the popup close handler from clearing focusedArea
                    suppressPopupCloseRef.current = true;
                    if (currentPopupRef.current) {
                        currentPopupRef.current.remove();
                        currentPopupRef.current = null;
                    }
                    suppressPopupCloseRef.current = false;

                    dispatch(setFocusedArea({ name, areaId, countryCode }));
                };

                // Cursor pointer on hover
                const mousemoveHandler = (e: any) => {
                    const caseCount = e.features?.[0]?.properties?.caseCount;
                    if (caseCount != null && caseCount > 0)
                        map.getCanvas().style.cursor = 'pointer';
                    else map.getCanvas().style.cursor = '';
                };

                const mouseleaveHandler = () => {
                    map.getCanvas().style.cursor = '';
                };

                // "Other" layer uses the same handlers (lower hit priority since adminJoin is above it)
                const clickOtherHandler = (e: any) => {
                    // Only fire if no adminJoin feature was hit at this point
                    const features = map.queryRenderedFeatures(e.point, { layers: ['adminJoin'] });
                    if (features.length > 0) return;
                    clickHandler(e);
                };

                const mousemoveOtherHandler = (e: any) => {
                    const features = map.queryRenderedFeatures(e.point, { layers: ['adminJoin'] });
                    if (features.length > 0) return;
                    mousemoveHandler(e);
                };

                const mouseleaveOtherHandler = () => {
                    mouseleaveHandler();
                };

                map.on('click', 'adminJoin', clickHandler);
                map.on('mousemove', 'adminJoin', mousemoveHandler);
                map.on('mouseleave', 'adminJoin', mouseleaveHandler);
                map.on('click', 'adminJoinOtherStripe', clickOtherHandler);
                map.on('mousemove', 'adminJoinOtherStripe', mousemoveOtherHandler);
                map.on('mouseleave', 'adminJoinOtherStripe', mouseleaveOtherHandler);

                if (isCancelled) {
                    map.off('click', 'adminJoin', clickHandler);
                    map.off('mousemove', 'adminJoin', mousemoveHandler);
                    map.off('mouseleave', 'adminJoin', mouseleaveHandler);
                    map.off('click', 'adminJoinOtherStripe', clickOtherHandler);
                    map.off('mousemove', 'adminJoinOtherStripe', mousemoveOtherHandler);
                    map.off('mouseleave', 'adminJoinOtherStripe', mouseleaveOtherHandler);
                    return;
                }

                handlersRef.current = {
                    click: clickHandler,
                    mousemove: mousemoveHandler,
                    mouseleave: mouseleaveHandler,
                    clickOther: clickOtherHandler,
                    mousemoveOther: mousemoveOtherHandler,
                    mouseleaveOther: mouseleaveOtherHandler,
                };

                setMapLoaded(true);
            } catch (error) {
                console.error('Failed to load geoBoundaries:', error);
            }
        };

        setupLayer();

        return () => {
            isCancelled = true;
            const { click, mousemove, mouseleave, clickOther, mousemoveOther, mouseleaveOther } = handlersRef.current;
            if (map) {
                if (click) map.off('click', 'adminJoin', click);
                if (mousemove) map.off('mousemove', 'adminJoin', mousemove);
                if (mouseleave) map.off('mouseleave', 'adminJoin', mouseleave);
                if (clickOther) map.off('click', 'adminJoinOtherStripe', clickOther);
                if (mousemoveOther) map.off('mousemove', 'adminJoinOtherStripe', mousemoveOther);
                if (mouseleaveOther) map.off('mouseleave', 'adminJoinOtherStripe', mouseleaveOther);
            }
            handlersRef.current = { click: null, mousemove: null, mouseleave: null, clickOther: null, mousemoveOther: null, mouseleaveOther: null };
        };
    }, [map, mapLoaded, data, adminLevel, dataFeatureSet, dataLayerBounds, dispatch, setFocusedArea]);

    // Update choropleth colors when dataLayerBounds change
    useEffect(() => {
        if (!map || !mapLoaded) return;

        const fillColorExpression = [
            'case',
            ['has', 'caseCount'],
            [
                'case',
                ['==', ['get', 'caseCount'], 0],
                ChoroplethMapColors.empty,
                ['<=', ['get', 'caseCount'], dataLayerBounds.level1.upper.number],
                ChoroplethMapColors.level1,
                ['<=', ['get', 'caseCount'], dataLayerBounds.level2.upper.number],
                ChoroplethMapColors.level2,
                ['<=', ['get', 'caseCount'], dataLayerBounds.level3.upper.number],
                ChoroplethMapColors.level3,
                ['<=', ['get', 'caseCount'], dataLayerBounds.level4.upper.number],
                ChoroplethMapColors.level4,
                ['<=', ['get', 'caseCount'], dataLayerBounds.level5.upper.number],
                ChoroplethMapColors.level5,
                ['>', ['get', 'caseCount'], dataLayerBounds.level5.upper.number],
                ChoroplethMapColors.level6,
                ChoroplethMapColors.empty,
            ],
            ChoroplethMapColors.empty,
        ];

        const stripePatternExpression = [
            'case',
            ['has', 'caseCount'],
            [
                'case',
                ['==', ['get', 'caseCount'], 0],
                'stripe-empty',
                ['<=', ['get', 'caseCount'], dataLayerBounds.level1.upper.number],
                'stripe-level1',
                ['<=', ['get', 'caseCount'], dataLayerBounds.level2.upper.number],
                'stripe-level2',
                ['<=', ['get', 'caseCount'], dataLayerBounds.level3.upper.number],
                'stripe-level3',
                ['<=', ['get', 'caseCount'], dataLayerBounds.level4.upper.number],
                'stripe-level4',
                ['<=', ['get', 'caseCount'], dataLayerBounds.level5.upper.number],
                'stripe-level5',
                'stripe-level6',
            ],
            'stripe-empty',
        ];

        if (map.getLayer('adminJoin')) {
            map.setPaintProperty('adminJoin', 'fill-color', fillColorExpression);
        }
        if (map.getLayer('adminJoinOtherStripe')) {
            map.setPaintProperty('adminJoinOtherStripe', 'fill-pattern', stripePatternExpression);
        }
    }, [map, mapLoaded, dataLayerBounds]);

    // Fly to country
    useEffect(() => {
        if (!focusedArea) {
            currentPopupRef.current?.remove();
            popupRootRef.current?.unmount();
            popupRootRef.current = null;
            currentPopupRef.current = null;
            return;
        }

        const areaId = focusedArea.areaId;

        const dataUnion2 = data as (CountryData | StateData | RegionalData)[];
        const foundArea = dataUnion2.find((rd) => rd.areaId === areaId);

        if (foundArea) {
            const bounds = foundArea.bounds;
            const lastUploadDate = convertStringDateToDate(
                foundArea.lastUpdated,
            );
            const popupTitle = foundArea.name;

            map?.fitBounds(bounds, { padding: 150 });

            const popupContent = (
                <PopupContentText>
                    {foundArea.caseCount.toLocaleString()} confirmed case
                    {foundArea.caseCount > 1 ? 's' : ''}
                </PopupContentText>
            );

            const popupElement = document.createElement('div');
            const popupRoot = createRoot(popupElement);
            popupRoot.render(
                <MapPopup
                    title={popupTitle}
                    content={popupContent}
                    lastUploadDate={lastUploadDate}
                />,
            );

            if (map) {
                // Unmount the previous root before replacing content
                if (popupRootRef.current) {
                    popupRootRef.current.unmount();
                }
                popupRootRef.current = popupRoot;

                if (!currentPopupRef.current) {
                    const popup = new Popup({
                        anchor: 'bottom',
                        closeButton: false,
                        closeOnClick: true,
                    })
                        .setLngLat([foundArea.long, foundArea.lat])
                        .setDOMContent(popupElement)
                        .addTo(map);

                    popup.on('close', () => {
                        popupRootRef.current?.unmount();
                        popupRootRef.current = null;
                        currentPopupRef.current = null;
                        if (!suppressPopupCloseRef.current) {
                            dispatch(setFocusedArea(null));
                        }
                    });

                    currentPopupRef.current = popup;
                } else {
                    currentPopupRef.current
                        .setLngLat([foundArea.long, foundArea.lat])
                        .setDOMContent(popupElement);
                }
            }
        } else {
            currentPopupRef.current?.remove();
            currentPopupRef.current = null;
            map?.fitBounds([0, -12.4, 0, 70.15]);
        }
    }, [focusedArea, map, data, dispatch, setFocusedArea]);
};
