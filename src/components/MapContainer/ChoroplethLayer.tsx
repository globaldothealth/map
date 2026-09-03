import { createRoot } from "react-dom/client";
import React, { useEffect } from "react";
import { ActionCreatorWithPayload } from "@reduxjs/toolkit";
import { Map, Popup } from "maplibre-gl";

import MapPopup from "src/components/MapPopup";
import { PopupContentText } from "src/components/MapPopup/styled";
import { ChoroplethMapColors } from "src/models/Colors";
import { AdminMetadata } from "src/models/AdminMetadata.ts";
import { CountryData } from "src/models/CountryData";
import { FocusedArea } from "src/models/FocusedArea";
import { RegionalData } from "src/models/RegionalData";
import { StateData } from "src/models/StateData";
import { useAppDispatch } from "src/redux/hooks";
import { convertStringDateToDate } from "src/utils/helperFunctions";


export const useChoroplethLayer = (
  map: Map | null,
  adminLevel: number,
  data: CountryData[] | StateData[] | RegionalData[],
  metadata: AdminMetadata,
  countryMetadata: AdminMetadata,
  setMapLoaded: React.Dispatch<React.SetStateAction<boolean>>,
  mapLoaded: boolean,
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
  const popupCloseHandlerRef = React.useRef<(() => void) | null>(null);
  const suppressPopupCloseRef = React.useRef(false);
  const previousFeatureStateIdsRef = React.useRef<(string | number)[]>([]);
  const skipInitialAutoFitRef = React.useRef(
    typeof window !== "undefined" &&
      (() => {
        const params = new URLSearchParams(window.location.search);
        return params.has("lng") || params.has("lat") || params.has("zoom");
      })(),
  );
  const handlersRef = React.useRef<{
    click: ((e: any) => void) | null;
    mousemove: ((e: any) => void) | null;
    mouseleave: (() => void) | null;
  }>({
    click: null,
    mousemove: null,
    mouseleave: null,
   });

  const removePopupInternally = () => {
    if (!currentPopupRef.current) {
      popupRootRef.current?.unmount();
      popupRootRef.current = null;
      popupCloseHandlerRef.current = null;
      return;
    }

    if (popupCloseHandlerRef.current) {
      currentPopupRef.current.off("close", popupCloseHandlerRef.current);
      popupCloseHandlerRef.current = null;
    }

    suppressPopupCloseRef.current = true;
    popupRootRef.current?.unmount();
    popupRootRef.current = null;
    currentPopupRef.current.remove();
    currentPopupRef.current = null;
    suppressPopupCloseRef.current = false;
  };

   // ─── Fit map to all available areas when data/metadata changes ───────────
  useEffect(() => {
    if (!map || !mapLoaded || !data.length || !Object.keys(metadata).length) return;

    // Preserve deep-link camera from URL on initial load.
    if (skipInitialAutoFitRef.current) {
      skipInitialAutoFitRef.current = false;
      return;
    }

    let west = Infinity, south = Infinity, east = -Infinity, north = -Infinity;
    let found = false;

    for (const area of data) {
      const entry = metadata[area.areaId];
      if (!entry?.bounds) continue;

      // Normalise LngLatBoundsLike → [w, s, e, n]
      const [w, s, e, n] = entry.bounds as number[];

      west  = Math.min(west,  w);
      south = Math.min(south, s);
      east  = Math.max(east,  e);
      north = Math.max(north, n);
      found = true;
    }

    if (found) {
      map.fitBounds([west, south, east, north], { padding: 150, animate: true });
    }
  }, [map, mapLoaded, data, metadata]);

  // ─── Setup layer ──────────────────────────────────────────────────────────
   useEffect(() => {
     if (!map || !mapLoaded) return;

    let isCancelled = false;
    const admin0TilesUrl = import.meta.env.VITE_ADMIN0_TILES_URL as
      | string
      | undefined;
    const admin1TilesUrl = import.meta.env.VITE_ADMIN1_TILES_URL as
      | string
      | undefined;
    const admin2TilesUrl = import.meta.env.VITE_ADMIN2_TILES_URL as
      | string
      | undefined;
    const admin0SourceLayer = import.meta.env.VITE_ADMIN0_TILES_SOURCE_LAYER || "admin0";
    const admin1SourceLayer = import.meta.env.VITE_ADMIN1_TILES_SOURCE_LAYER || "admin1";
    const admin2SourceLayer = import.meta.env.VITE_ADMIN2_TILES_SOURCE_LAYER || "admin2";
    const activeTilesConfig =
       adminLevel === 0 && admin0TilesUrl
         ? {
             url: admin0TilesUrl,
             sourceLayer: admin0SourceLayer,
           }
         : adminLevel === 1 && admin1TilesUrl
           ? {
               url: admin1TilesUrl,
               sourceLayer: admin1SourceLayer,
             }
           : adminLevel === 2 && admin2TilesUrl
             ? {
                 url: admin2TilesUrl,
                 sourceLayer: admin2SourceLayer,
               }
             : null;

    if (!activeTilesConfig) return;

    const setupLayer = async () => {
      try {
        const dataUnion = data as (CountryData | StateData | RegionalData)[];

        const sourceId = `adminSource`;
        const sourceLayerProps = { "source-layer": activeTilesConfig!.sourceLayer } as const;
        const featureStateTarget = (id: string | number) => ({
          source: sourceId,
          sourceLayer: activeTilesConfig!.sourceLayer,
          id,
        });

        // Remove layers before re-adding so they always reflect current adminLevel and data
        const layersToRemove = [
          "countryLabels",
          "adminJoinLabels",
          "adminJoinBorder",
          "adminJoin",
          "adminJoinEmpty",
        ];
        for (const layerId of layersToRemove) {
          if (map.getLayer(layerId)) map.removeLayer(layerId);
        }

        const currentSource = map.getSource(sourceId) as any;
        const currentSourceType = currentSource?.type;
        const styleSource = map.getStyle().sources?.[sourceId] as any;
        const activeTileUrl = activeTilesConfig?.url;
        const currentTileUrl = styleSource?.tiles?.[0];
        const shouldRecreateVectorSource = currentSource && currentSourceType === "vector" && (currentTileUrl !== activeTileUrl);
        if (
          currentSource &&
          (currentSourceType !== "vector" || shouldRecreateVectorSource)
        ) {
          map.removeSource(sourceId);
        }

        if (!map.getSource(sourceId)) {
          map.addSource(sourceId, {
            type: "vector",
            tiles: [activeTilesConfig!.url],
            promoteId: 'areaID',
          } as any);
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

        const firstSymbolLayer = map
          .getStyle()
          .layers?.find((layer) => layer.type === "symbol")?.id;

        const areaIdsFromData = dataUnion
          .filter((area) => !!area.areaId)
          .map((area) => String(area.areaId));
        const areaIdExpression = [
          "to-string",
          [
            "coalesce",
            ["get", "areaID"],
            ["get", "areaId"],
            ["get", "area_id"],
            "",
          ],
        ];

        const shouldShowBorderExpression = [
          "in",
          areaIdExpression,
          ["literal", areaIdsFromData],
        ];

        map.addLayer(
          {
            id: `adminJoin`,
            type: "fill",
            source: sourceId,
            ...sourceLayerProps,
            paint: {
              "fill-color": [
                "case",
                [">", ["coalesce", ["feature-state", "caseCount"], 0], 0],
                [
                  "case",
                  [
                    "<=",
                    ["coalesce", ["feature-state", "caseCount"], 0],
                    dataLayerBounds.level1.upper.number,
                  ],
                  ChoroplethMapColors.level1,
                  [
                    "<=",
                    ["coalesce", ["feature-state", "caseCount"], 0],
                    dataLayerBounds.level2.upper.number,
                  ],
                  ChoroplethMapColors.level2,
                  [
                    "<=",
                    ["coalesce", ["feature-state", "caseCount"], 0],
                    dataLayerBounds.level3.upper.number,
                  ],
                  ChoroplethMapColors.level3,
                  [
                    "<=",
                    ["coalesce", ["feature-state", "caseCount"], 0],
                    dataLayerBounds.level4.upper.number,
                  ],
                  ChoroplethMapColors.level4,
                  [
                    "<=",
                    ["coalesce", ["feature-state", "caseCount"], 0],
                    dataLayerBounds.level5.upper.number,
                  ],
                  ChoroplethMapColors.level5,
                  [
                    ">",
                    ["coalesce", ["feature-state", "caseCount"], 0],
                    dataLayerBounds.level5.upper.number,
                  ],
                  ChoroplethMapColors.level6,
                  ChoroplethMapColors.empty,
                ],
                ChoroplethMapColors.empty,
              ],
              "fill-opacity": [
                "case",
                [">", ["coalesce", ["feature-state", "caseCount"], 0], 0],
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
            type: "line",
            source: sourceId,
            ...sourceLayerProps,
            paint: {
              "line-color": ChoroplethMapColors["borders"],
              "line-opacity": ["case", shouldShowBorderExpression, 1, 0],
            },
          } as any,
          firstSymbolLayer,
        );

        // Build country-level totals so labels with non-zero cases can be placed first.
        const countryCaseCountByCode = dataUnion.reduce<Record<string, number>>(
          (acc, area) => {
            const countryCode = String(area.areaId || "").split(".")[0];
            if (!countryCode) return acc;
            acc[countryCode] = (acc[countryCode] || 0) + (area.caseCount || 0);
            return acc;
          },
          {},
        );

        // Country labels are always visible and always come from countryMetadata.
        const isSubcountryView = adminLevel !== 0;
        const countryLabelFeatures = Object.entries(countryMetadata).map(
          ([countryCode, entry]) => ({
            type: "Feature" as const,
            geometry: {
              type: "Point" as const,
              coordinates: [entry.long, entry.lat],
            },
            properties: {
              name: entry.name,
              caseCount: countryCaseCountByCode[countryCode] || 0,
            },
          }),
        );
        const countryLabelSourceId = "countryLabelSource";
        if (map.getSource(countryLabelSourceId)) {
          (map.getSource(countryLabelSourceId) as any).setData({
            type: "FeatureCollection",
            features: countryLabelFeatures,
          });
        } else {
          map.addSource(countryLabelSourceId, {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: countryLabelFeatures,
            },
          });
        }
        map.addLayer(
          {
            id: "countryLabels",
            type: "symbol",
            source: countryLabelSourceId,
            layout: {
              "text-field": ["get", "name"],
              "text-size": [
                "interpolate",
                ["linear"],
                ["zoom"],
                3, isSubcountryView ? 13 : 12,
                6, isSubcountryView ? 15 : 14,
                10, isSubcountryView ? 17 : 16,
              ],
              "text-font": ["Open Sans Semibold", "Noto Sans Regular"],
              "text-max-width": 8,
              "text-letter-spacing": 0.05,
              "text-anchor": "center",
              "text-variable-anchor": ["center", "top", "bottom", "left", "right"],
              "text-radial-offset": 0.3,
              "text-justify": "auto",
              "text-padding": 2,
              "text-allow-overlap": false,
              "text-ignore-placement": false,
              // Lower sort keys are placed first when overlap is disabled.
              "symbol-sort-key": [
                "case",
                [">", ["coalesce", ["get", "caseCount"], 0], 0],
                0,
                1,
              ],
            },
            paint: {
              "text-color": isSubcountryView ? "#7a7a7a" : "#666666",
              "text-halo-color": "#ffffff",
              "text-halo-width": 1.5,
              "text-halo-blur": 0.5,
              "text-opacity": isSubcountryView ? 0.9 : 1,
            },
          } as any,
          firstSymbolLayer,
        );

        // Avoid duplicate names at admin0, where metadata already represents countries.
        const shouldRenderAdminLabels = adminLevel !== 0;
        if (shouldRenderAdminLabels) {
          const labelFeatures = dataUnion
            .filter((area) => !!area.areaId && metadata[area.areaId])
            .map((area) => {
              const entry = metadata[area.areaId];
              return {
                type: "Feature" as const,
                geometry: {
                  type: "Point" as const,
                  coordinates: [entry.long, entry.lat],
                },
                properties: {
                  name: entry.name,
                  caseCount: area.caseCount,
                },
              };
            });

          const labelSourceId = "adminLabelSource";
          if (map.getSource(labelSourceId)) {
            (map.getSource(labelSourceId) as any).setData({
              type: "FeatureCollection",
              features: labelFeatures,
            });
          } else {
            map.addSource(labelSourceId, {
              type: "geojson",
              data: {
                type: "FeatureCollection",
                features: labelFeatures,
              },
            });
          }

          map.addLayer(
            {
              id: "adminJoinLabels",
              type: "symbol",
              source: labelSourceId,
              layout: {
                "text-field": ["get", "name"],
                "text-size": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  3, 13,
                  6, 16,
                  10, 18,
                ],
                "text-font": ["Open Sans Semibold", "Noto Sans Regular"],
                "text-max-width": 7,
                "text-letter-spacing": 0.05,
                "text-anchor": "center",
                "text-variable-anchor": ["center", "top", "bottom", "left", "right"],
                "text-radial-offset": 0.3,
                "text-justify": "auto",
                "text-padding": 2,
                "text-allow-overlap": false,
                "text-ignore-placement": false,
                // Lower sort keys are placed first when overlap is disabled.
                "symbol-sort-key": [
                  "case",
                  [">", ["coalesce", ["get", "caseCount"], 0], 0],
                  0,
                  1,
                ],
              },
              paint: {
                "text-color": "#666666",
                "text-halo-color": "#ffffff",
                "text-halo-width": 1.5,
                "text-halo-blur": 0.5,
                "text-opacity": [
                  "case",
                  [">", ["get", "caseCount"], 0],
                  1,
                  0.7,
                ],
              },
            } as any,
            firstSymbolLayer,
          );
        }


        // Remove previously registered handlers to prevent duplicates
        if (handlersRef.current.click)
          map.off("click", "adminJoin", handlersRef.current.click);
        if (handlersRef.current.mousemove)
          map.off("mousemove", "adminJoin", handlersRef.current.mousemove);
        if (handlersRef.current.mouseleave)
          map.off("mouseleave", "adminJoin", handlersRef.current.mouseleave);

        const clickHandler = (e: any) => {
          // Loop through all features at the click point and find the first one with caseCount > 0
          const features = e.features || [];
          let targetFeature = null;

          for (const feature of features) {
            const areaId = feature.properties?.areaID;
            if (!areaId) continue;

            const featureState = map.getFeatureState(
              featureStateTarget(areaId),
            ) as { caseCount?: number };

            if ((featureState?.caseCount ?? 0) > 0) {
              targetFeature = feature;
              break;
            }
          }

          if (!targetFeature) {
            dispatch(setFocusedArea(null));
            return;
          }

          const areaId = targetFeature.properties.areaID;
          const name = metadata[areaId].name;
          const countryCode = areaId.split('.')[0];

          removePopupInternally();

          dispatch(
            setFocusedArea({
              name,
              areaId,
              countryCode
            }),
          );
        };

        // Cursor pointer on hover
        const mousemoveHandler = (e: any) => {
          const props = e.features?.[0]?.properties || {};
          const featureId =
            props.areaId ||
            props.areaID ||
            props.area_id ||
            e.features?.[0]?.id;
          const caseCount = featureId
            ? (
                map.getFeatureState(featureStateTarget(featureId)) as {
                  caseCount?: number;
                }
              )?.caseCount
            : null;
          if (caseCount != null && caseCount > 0)
            map.getCanvas().style.cursor = "pointer";
          else map.getCanvas().style.cursor = "";
        };

        const mouseleaveHandler = () => {
          map.getCanvas().style.cursor = "";
        };

        map.on("click", "adminJoin", clickHandler);
        map.on("mousemove", "adminJoin", mousemoveHandler);
        map.on("mouseleave", "adminJoin", mouseleaveHandler);

        if (isCancelled) {
          map.off("click", "adminJoin", clickHandler);
          map.off("mousemove", "adminJoin", mousemoveHandler);
          map.off("mouseleave", "adminJoin", mouseleaveHandler);
          return;
        }

        handlersRef.current = {
          click: clickHandler,
          mousemove: mousemoveHandler,
          mouseleave: mouseleaveHandler,
        };

        setMapLoaded(true);
      } catch (error) {
        console.error("Failed to load geoBoundaries:", error);
      }
    };

    setupLayer();

    return () => {
      isCancelled = true;
      const {
        click,
        mousemove,
        mouseleave,
      } = handlersRef.current;
      if (map) {
        if (click) map.off("click", "adminJoin", click);
        if (mousemove) map.off("mousemove", "adminJoin", mousemove);
        if (mouseleave) map.off("mouseleave", "adminJoin", mouseleave);
      }
      handlersRef.current = {
        click: null,
        mousemove: null,
        mouseleave: null,
      };

      if (map) {
        for (const id of previousFeatureStateIdsRef.current) {
          map.removeFeatureState({
            source: "adminSource",
            sourceLayer: activeTilesConfig!.sourceLayer,
            id,
          });
        }
      }
      previousFeatureStateIdsRef.current = [];
    };
   }, [
     map,
     mapLoaded,
     data,
     metadata,
     countryMetadata,
     adminLevel,
     dataLayerBounds,
     outbreakName,
     dispatch,
     setFocusedArea,
   ]);

  // ─── Update choropleth colors when dataLayerBounds change ─────────────────
  useEffect(() => {
    if (!map || !mapLoaded) return;

    const fillColorExpression = [
      "case",
      [">", ["coalesce", ["feature-state", "caseCount"], 0], 0],
      [
        "case",
        [
          "<=",
          ["coalesce", ["feature-state", "caseCount"], 0],
          dataLayerBounds.level1.upper.number,
        ],
        ChoroplethMapColors.level1,
        [
          "<=",
          ["coalesce", ["feature-state", "caseCount"], 0],
          dataLayerBounds.level2.upper.number,
        ],
        ChoroplethMapColors.level2,
        [
          "<=",
          ["coalesce", ["feature-state", "caseCount"], 0],
          dataLayerBounds.level3.upper.number,
        ],
        ChoroplethMapColors.level3,
        [
          "<=",
          ["coalesce", ["feature-state", "caseCount"], 0],
          dataLayerBounds.level4.upper.number,
        ],
        ChoroplethMapColors.level4,
        [
          "<=",
          ["coalesce", ["feature-state", "caseCount"], 0],
          dataLayerBounds.level5.upper.number,
        ],
        ChoroplethMapColors.level5,
        [
          ">",
          ["coalesce", ["feature-state", "caseCount"], 0],
          dataLayerBounds.level5.upper.number,
        ],
        ChoroplethMapColors.level6,
        ChoroplethMapColors.empty,
      ],
      ChoroplethMapColors.empty,
    ];

    if (map.getLayer("adminJoin")) {
      map.setPaintProperty("adminJoin", "fill-color", fillColorExpression);
    }
  }, [map, mapLoaded, dataLayerBounds]);

  useEffect(() => {
    if (!focusedArea) {
      removePopupInternally();
      return;
    }

    const areaId = focusedArea.areaId;
    const areaData = data.find(rd => rd.areaId == areaId)
    const areaMetadata = metadata[areaId];

    if (areaData && areaMetadata) {
      const {long, lat, bounds} = areaMetadata;

      map && bounds && map.fitBounds(bounds, { padding: 150 });

      const lastUploadDate = convertStringDateToDate(areaData.lastUpdated);
      const popupTitle = areaMetadata.name;
      const popupContent = (
        <PopupContentText>
          {areaData.caseCount.toLocaleString()} confirmed case
          {areaData.caseCount > 1 ? "s" : ""}
        </PopupContentText>
      );

      const popupElement = document.createElement("div");
      const popupRoot = createRoot(popupElement);
      popupRoot.render(
        <MapPopup
          title={popupTitle}
          content={popupContent}
          lastUploadDate={lastUploadDate}
        />,
      );

      if (map) {
        if (popupRootRef.current) {
          popupRootRef.current.unmount();
        }
        popupRootRef.current = popupRoot;

        if (!currentPopupRef.current) {
          const popup = new Popup({
            anchor: "bottom",
            closeButton: false,
            closeOnClick: true,
          })
            .setLngLat([long, lat])
            .setDOMContent(popupElement)
            .addTo(map);

          const popupCloseHandler = () => {
            popupRootRef.current?.unmount();
            popupRootRef.current = null;
            currentPopupRef.current = null;
            popupCloseHandlerRef.current = null;
            if (!suppressPopupCloseRef.current) {
              dispatch(setFocusedArea(null));
            }
          };

          popupCloseHandlerRef.current = popupCloseHandler;
          popup.on("close", popupCloseHandler);

          currentPopupRef.current = popup;
        } else {
          currentPopupRef.current
            .setLngLat([long, lat])
            .setDOMContent(popupElement);
        }
      }
    } else {
      removePopupInternally();
      map?.fitBounds([0, -12.4, 0, 70.15]);
    }
  }, [focusedArea, map, data, metadata, dispatch, setFocusedArea]);
};
