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
  const suppressPopupCloseRef = React.useRef(false);
  const previousFeatureStateIdsRef = React.useRef<(string | number)[]>([]);
  const handlersRef = React.useRef<{
    click: ((e: any) => void) | null;
    mousemove: ((e: any) => void) | null;
    mouseleave: (() => void) | null;
  }>({
    click: null,
    mousemove: null,
    mouseleave: null,
   });

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

        if (
          adminLevel === 2 ||
          (adminLevel === 1 && outbreakName === "EbolaBVD")
        ) {
          map.addLayer(
            {
              id: "adminJoinLabels",
              type: "symbol",
              source: sourceId,
              ...sourceLayerProps,
              layout: {
                "text-field": [
                  "coalesce",
                  ["get", "labelName"],
                  ["get", "shapeName"],
                  ["get", "name"],
                ],
                "text-size": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  3,
                  11,
                  6,
                  14,
                  10,
                  16,
                ],
                "text-font": ["Open Sans Regular"],
                "text-max-width": 8,
                "text-anchor": "center",
                "text-variable-anchor": [
                  "center",
                  "top",
                  "bottom",
                  "left",
                  "right",
                ],
                "text-radial-offset": 0.35,
                "text-justify": "auto",
                "text-padding": 2,
                "text-allow-overlap": false,
                "text-ignore-placement": false,
              },
              paint: {
                "text-color": "#333333",
                "text-halo-color": "#ffffff",
                "text-halo-width": 1.5,
                "text-opacity": ["case", shouldShowBorderExpression, 1, 0],
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
          const countryCode =
            props.countryCode || props.country_code || props.shapeGroup;

          suppressPopupCloseRef.current = true;
          if (currentPopupRef.current) {
            currentPopupRef.current.remove();
            currentPopupRef.current = null;
          }
          suppressPopupCloseRef.current = false;

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
      currentPopupRef.current?.remove();
      popupRootRef.current?.unmount();
      popupRootRef.current = null;
      currentPopupRef.current = null;
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

          popup.on("close", () => {
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
            .setLngLat([long, lat])
            .setDOMContent(popupElement);
        }
      }
    } else {
      currentPopupRef.current?.remove();
      currentPopupRef.current = null;
      map?.fitBounds([0, -12.4, 0, 70.15]);
    }
  }, [focusedArea, map, data, metadata, dispatch, setFocusedArea]);
};
