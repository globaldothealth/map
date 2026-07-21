import { createRoot } from 'react-dom/client';
import React, { useEffect } from 'react';
import { ActionCreatorWithPayload } from '@reduxjs/toolkit';
import { FeatureCollection } from 'geojson';
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
    outbreakName?: string,
) => {
    const dispatch = useAppDispatch();
    const currentPopupRef = React.useRef<Popup | null>(null);
    const popupRootRef = React.useRef<ReturnType<typeof createRoot> | null>(null);
    const suppressPopupCloseRef = React.useRef(false);
    const previousFeatureStateIdsRef = React.useRef<(string | number)[]>([]);
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
        const admin0TilesUrl = import.meta.env.VITE_ADMIN0_TILES_URL as
            | string
            | undefined;
        const admin0SourceLayer =
            (import.meta.env.VITE_ADMIN0_TILES_SOURCE_LAYER as
                | string
                | undefined) || 'admin0';
        const admin0PromoteId =
            (import.meta.env.VITE_ADMIN0_TILES_PROMOTE_ID as
                | string
                | undefined) || 'areaID';
        const useAdmin0Tiles = adminLevel === 0 && !!admin0TilesUrl;

        const setupLayer = async () => {
            try {
                const dataUnion = data as (
                    | CountryData
                    | StateData
                    | RegionalData
                )[];

                const boundaries: FeatureCollection | null = !useAdmin0Tiles
                    ? {
                          type: 'FeatureCollection',
                          features: dataUnion.map((d) => ({
                              type: 'Feature' as const,
                              id: d.areaId,
                              geometry: d.geometry as any,
                              properties: {
                                  shapeGroup: d.countryCode,
                                  shapeName: d.name,
                                  shapeType: `ADMIN`,
                                  areaName: d.name,
                                  labelName:
                                      d.name?.startsWith('Other (') &&
                                      d.name?.endsWith(')')
                                          ? d.name.slice('Other ('.length, -1)
                                          : d.name,
                                  countryCode: d.countryCode,
                                  areaId: d.areaId,
                                  lat: d.lat,
                                  long: d.long,
                              },
                          })),
                      }
                    : null;

                const sourceId = `adminSource`;
                const sourceLayerProps = useAdmin0Tiles
                    ? ({ 'source-layer': admin0SourceLayer } as const)
                    : {};
                const featureStateTarget = (id: string | number) =>
                    useAdmin0Tiles
                        ? {
                              source: sourceId,
                              sourceLayer: admin0SourceLayer,
                              id,
                          }
                        : {
                              source: sourceId,
                              id,
                          };

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

                const currentSource = map.getSource(sourceId) as any;
                const currentSourceType = currentSource?.type;
                const expectedSourceType = useAdmin0Tiles ? 'vector' : 'geojson';
                if (currentSource && currentSourceType !== expectedSourceType) {
                    map.removeSource(sourceId);
                }

                if (useAdmin0Tiles) {
                    if (!map.getSource(sourceId)) {
                        map.addSource(sourceId, {
                            type: 'vector',
                            tiles: [admin0TilesUrl!],
                            promoteId: admin0PromoteId,
                        } as any);
                    }
                } else if (map.getSource(sourceId)) {
                    (map.getSource(sourceId) as any).setData(boundaries);
                } else {
                    map.addSource(sourceId, {
                        type: 'geojson',
                        data: boundaries as FeatureCollection,
                        promoteId: 'areaId',
                    });
                }

                // Clear stale feature-state from previous outbreak/admin view.
                for (const id of previousFeatureStateIdsRef.current) {
                    map.removeFeatureState(featureStateTarget(id));
                }
                previousFeatureStateIdsRef.current = [];

                for (const area of dataUnion) {
                    if (!area.areaId) continue;
                    map.setFeatureState(featureStateTarget(area.areaId), {
                        caseCount: area.caseCount,
                    });
                    previousFeatureStateIdsRef.current.push(area.areaId);
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
                    ['>', ['coalesce', ['feature-state', 'caseCount'], 0], 0],
                    [
                        'case',
                        ['<=', ['coalesce', ['feature-state', 'caseCount'], 0], dataLayerBounds.level1.upper.number],
                        'stripe-level1',
                        ['<=', ['coalesce', ['feature-state', 'caseCount'], 0], dataLayerBounds.level2.upper.number],
                        'stripe-level2',
                        ['<=', ['coalesce', ['feature-state', 'caseCount'], 0], dataLayerBounds.level3.upper.number],
                        'stripe-level3',
                        ['<=', ['coalesce', ['feature-state', 'caseCount'], 0], dataLayerBounds.level4.upper.number],
                        'stripe-level4',
                        ['<=', ['coalesce', ['feature-state', 'caseCount'], 0], dataLayerBounds.level5.upper.number],
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
                            ...sourceLayerProps,
                            filter: ['==', ['coalesce', ['get', 'areaName'], ['get', 'shapeName']], 'Other (Ituri Province)'],
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
                            ...sourceLayerProps,
                            filter: [
                                'all',
                                ['!=', ['coalesce', ['get', 'areaName'], ['get', 'shapeName']], 'Other (Ituri Province)'],
                            ],
                            paint: {
                                'fill-color': ChoroplethMapColors.empty,
                                'fill-opacity': [
                                    'case',
                                    [
                                        '<=',
                                        ['coalesce', ['feature-state', 'caseCount'], 0],
                                        0,
                                    ],
                                    1,
                                    0,
                                ],
                            },
                        } as any,
                        firstSymbolLayer,
                    );

                map.addLayer(
                        {
                            id: `adminJoin`,
                            type: 'fill',
                            source: sourceId,
                            ...sourceLayerProps,
                            filter: [
                                'all',
                                ['!=', ['coalesce', ['get', 'areaName'], ['get', 'shapeName']], 'Other (Ituri Province)'],
                            ],
                            paint: {
                                'fill-color': [
                                    'case',
                                    ['>', ['coalesce', ['feature-state', 'caseCount'], 0], 0],
                                    [
                                        'case',
                                        [
                                            '<=',
                                            ['coalesce', ['feature-state', 'caseCount'], 0],
                                            dataLayerBounds.level1.upper.number,
                                        ],
                                        ChoroplethMapColors.level1,
                                        [
                                            '<=',
                                            ['coalesce', ['feature-state', 'caseCount'], 0],
                                            dataLayerBounds.level2.upper.number,
                                        ],
                                        ChoroplethMapColors.level2,
                                        [
                                            '<=',
                                            ['coalesce', ['feature-state', 'caseCount'], 0],
                                            dataLayerBounds.level3.upper.number,
                                        ],
                                        ChoroplethMapColors.level3,
                                        [
                                            '<=',
                                            ['coalesce', ['feature-state', 'caseCount'], 0],
                                            dataLayerBounds.level4.upper.number,
                                        ],
                                        ChoroplethMapColors.level4,
                                        [
                                            '<=',
                                            ['coalesce', ['feature-state', 'caseCount'], 0],
                                            dataLayerBounds.level5.upper.number,
                                        ],
                                        ChoroplethMapColors.level5,
                                        [
                                            '>',
                                            ['coalesce', ['feature-state', 'caseCount'], 0],
                                            dataLayerBounds.level5.upper.number,
                                        ],
                                        ChoroplethMapColors.level6,
                                        ChoroplethMapColors.empty,
                                    ],
                                    ChoroplethMapColors.empty,
                                ],
                                'fill-opacity': [
                                    'case',
                                    [
                                        '>',
                                        ['coalesce', ['feature-state', 'caseCount'], 0],
                                        0,
                                    ],
                                    1,
                                    0,
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
                            ...sourceLayerProps,
                            paint: {
                                'line-color': ChoroplethMapColors['borders'],
                            },
                        } as any,
                        firstSymbolLayer,
                    );

                if (adminLevel === 2 || (adminLevel === 1 && outbreakName === 'EbolaBVD')) {
                    map.addLayer(
                        {
                            id: 'adminJoinLabels',
                            type: 'symbol',
                            source: sourceId,
                            ...sourceLayerProps,
                            layout: {
                                'text-field': [
                                    'coalesce',
                                    ['get', 'labelName'],
                                    ['get', 'shapeName'],
                                    ['get', 'name'],
                                ],
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
                    const feature = e.features?.[0];
                    const props = feature?.properties || {};
                    const areaName = props.areaName || props.shapeName || props.name;

                    if (!feature || !areaName) {
                        dispatch(setFocusedArea(null));
                        return;
                    }

                    const featureId =
                        props.areaId || props.areaID || props.area_id || feature.id;
                    if (!featureId) return;

                    const featureState = map.getFeatureState(
                        featureStateTarget(featureId),
                    ) as { caseCount?: number };

                    if ((featureState?.caseCount ?? 0) === 0) return;

                    const name = String(areaName);
                    const areaId = String(featureId);
                    const countryCode = props.countryCode || props.country_code || props.shapeGroup;

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
                    const props = e.features?.[0]?.properties || {};
                    const featureId =
                        props.areaId || props.areaID || props.area_id || e.features?.[0]?.id;
                    const caseCount = featureId
                        ? (map.getFeatureState(featureStateTarget(featureId)) as { caseCount?: number })
                              ?.caseCount
                        : null;
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

            if (map) {
                for (const id of previousFeatureStateIdsRef.current) {
                    map.removeFeatureState(
                        useAdmin0Tiles
                            ? {
                                  source: 'adminSource',
                                  sourceLayer: admin0SourceLayer,
                                  id,
                              }
                            : { source: 'adminSource', id },
                    );
                }
            }
            previousFeatureStateIdsRef.current = [];
        };
    }, [map, mapLoaded, data, adminLevel, dataFeatureSet, dataLayerBounds, outbreakName, dispatch, setFocusedArea]);

    // Update choropleth colors when dataLayerBounds change
    useEffect(() => {
        if (!map || !mapLoaded) return;

        const fillColorExpression = [
            'case',
            ['>', ['coalesce', ['feature-state', 'caseCount'], 0], 0],
            [
                'case',
                ['<=', ['coalesce', ['feature-state', 'caseCount'], 0], dataLayerBounds.level1.upper.number],
                ChoroplethMapColors.level1,
                ['<=', ['coalesce', ['feature-state', 'caseCount'], 0], dataLayerBounds.level2.upper.number],
                ChoroplethMapColors.level2,
                ['<=', ['coalesce', ['feature-state', 'caseCount'], 0], dataLayerBounds.level3.upper.number],
                ChoroplethMapColors.level3,
                ['<=', ['coalesce', ['feature-state', 'caseCount'], 0], dataLayerBounds.level4.upper.number],
                ChoroplethMapColors.level4,
                ['<=', ['coalesce', ['feature-state', 'caseCount'], 0], dataLayerBounds.level5.upper.number],
                ChoroplethMapColors.level5,
                ['>', ['coalesce', ['feature-state', 'caseCount'], 0], dataLayerBounds.level5.upper.number],
                ChoroplethMapColors.level6,
                ChoroplethMapColors.empty,
            ],
            ChoroplethMapColors.empty,
        ];

        const stripePatternExpression = [
            'case',
            ['>', ['coalesce', ['feature-state', 'caseCount'], 0], 0],
            [
                'case',
                ['<=', ['coalesce', ['feature-state', 'caseCount'], 0], dataLayerBounds.level1.upper.number],
                'stripe-level1',
                ['<=', ['coalesce', ['feature-state', 'caseCount'], 0], dataLayerBounds.level2.upper.number],
                'stripe-level2',
                ['<=', ['coalesce', ['feature-state', 'caseCount'], 0], dataLayerBounds.level3.upper.number],
                'stripe-level3',
                ['<=', ['coalesce', ['feature-state', 'caseCount'], 0], dataLayerBounds.level4.upper.number],
                'stripe-level4',
                ['<=', ['coalesce', ['feature-state', 'caseCount'], 0], dataLayerBounds.level5.upper.number],
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
