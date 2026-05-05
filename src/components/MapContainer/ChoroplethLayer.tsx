import ReactDOM from 'react-dom';
import React, { useEffect, useState } from 'react';
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
) => {
    const dispatch = useAppDispatch();
    const smallScreen = useMediaQuery('(max-width:1400px)');
    const [currentPopup, setCurrentPopup] = useState<Popup | null>();

    useEffect(() => {
        if (!map || !mapLoaded || !dataFeatureSet) return;

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
