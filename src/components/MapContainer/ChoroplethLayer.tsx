import { createRoot } from "react-dom/client";
import React, { useEffect } from "react";
import { ActionCreatorWithPayload } from "@reduxjs/toolkit";
import { FeatureCollection } from "geojson";
import { Map, Popup } from "maplibre-gl";

import MapPopup from "src/components/MapPopup";
import { PopupContentText } from "src/components/MapPopup/styled";
import { ChoroplethMapColors } from "src/models/Colors";
import { CountryData } from "src/models/CountryData";
import { FocusedArea } from "src/models/FocusedArea";
import { RegionalData } from "src/models/RegionalData";
import { StateData } from "src/models/StateData";
import { useAppDispatch } from "src/redux/hooks";
import { convertStringDateToDate } from "src/utils/helperFunctions";

const getSpatialPropsFromTileFeature = (
  feature: any,
): {
  lat: number;
  long: number;
  bounds: [number, number, number, number];
} | null => {
  const props = feature?.properties || {};
  const lat = Number(props.lat);
  const long = Number(props.long);
  let bounds: [number, number, number, number] | null = null;
  if (props.bounds != null) {
    try {
      bounds = JSON.parse(props.bounds);
    } catch {
      bounds = null;
    }
  }
  if (bounds == null && props.bounds_w != null) {
    const w = Number(props.bounds_w);
    const s = Number(props.bounds_s);
    const e = Number(props.bounds_e);
    const n = Number(props.bounds_n);
    if ([w, s, e, n].every(Number.isFinite)) bounds = [w, s, e, n];
  }
  if (!Number.isFinite(lat) || !Number.isFinite(long) || !bounds) {
    return null;
  }
  return { lat, long, bounds };
};

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
  // Cache of areaId → spatial props, populated as tiles load so off-screen
  // areas can still be panned to when selected from the sidebar.
  const tileFeatureCacheRef = React.useRef<
    Record<string, { lat: number; long: number; bounds: [number, number, number, number] }>
  >({});
  // Keep tile-mode state accessible in effects without adding to dep arrays
  const useTilesRef = React.useRef(false);
  const activeTilesConfigRef = React.useRef<{
    url: string;
    sourceLayer: string;
    promoteId: string;
  } | null>(null);
  const handlersRef = React.useRef<{
    click: ((e: any) => void) | null;
    mousemove: ((e: any) => void) | null;
    mouseleave: (() => void) | null;
    clickOther: ((e: any) => void) | null;
    mousemoveOther: ((e: any) => void) | null;
    mouseleaveOther: (() => void) | null;
  }>({
    click: null,
    mousemove: null,
    mouseleave: null,
    clickOther: null,
    mousemoveOther: null,
    mouseleaveOther: null,
  });

  // // ─── Fit map to data bounds ───────────────────────────────────────────────
  // useEffect(() => {
  //   if (!map || !mapLoaded || data.length === 0) return;
  //
  //   if (useTilesRef.current && activeTilesConfigRef.current) {
  //     // Derive aggregate bounds from tile feature properties
  //     const sourceId = "adminSource";
  //     const sourceLayer = activeTilesConfigRef.current.sourceLayer;
  //     const dataUnion = data as (CountryData | StateData | RegionalData)[];
  //     const areaIdSet = new Set(dataUnion.map((d) => String(d.areaId)));
  //
  //     const features = map.querySourceFeatures(sourceId, { sourceLayer });
  //     let agg: [number, number, number, number] = [180, 90, -180, -90];
  //     let found = false;
  //
  //     for (const f of features) {
  //       const props = f.properties || {};
  //       console.log("FEATURE", props);
  //       const fid = String(props.areaID ?? props.areaId ?? props.area_id ?? "");
  //       if (!areaIdSet.has(fid)) continue;
  //
  //       const w = parseFloat(
  //         props.bounds_w ?? props.bbox_w ?? props.west ?? "",
  //       );
  //       const s = parseFloat(
  //         props.bounds_s ?? props.bbox_s ?? props.south ?? "",
  //       );
  //       const e = parseFloat(
  //         props.bounds_e ?? props.bbox_e ?? props.east ?? "",
  //       );
  //       const n = parseFloat(
  //         props.bounds_n ?? props.bbox_n ?? props.north ?? "",
  //       );
  //
  //       if ([w, s, e, n].some(isNaN)) continue;
  //       agg = [
  //         Math.min(agg[0], w),
  //         Math.min(agg[1], s),
  //         Math.max(agg[2], e),
  //         Math.max(agg[3], n),
  //       ];
  //       found = true;
  //     }
  //
  //     if (found) {
  //       map.fitBounds(agg, { padding: 150 });
  //       return;
  //     }
  //     // Fall through to Redux data bounds if tile features aren't queryable yet
  //   }
  //
  //   // GeoJSON path (or tile fallback): use Redux data when valid bounds exist
  //   let bounds: [number, number, number, number] | null = null;
  //   for (const entry of data) {
  //     console.log(entry);
  //     const candidate = (entry as { bounds?: unknown }).bounds;
  //     if (!Array.isArray(candidate) || candidate.length !== 4) continue;
  //     const [w, s, e, n] = candidate.map((v) => Number(v));
  //     if ([w, s, e, n].some((v) => !Number.isFinite(v))) continue;
  //
  //     if (!bounds) {
  //       bounds = [w, s, e, n];
  //     } else {
  //       bounds = [
  //         Math.min(bounds[0], w),
  //         Math.min(bounds[1], s),
  //         Math.max(bounds[2], e),
  //         Math.max(bounds[3], n),
  //       ];
  //     }
  //   }
  //
  //   if (bounds) {
  //     map.fitBounds(bounds, { padding: 150 });
  //   }
  // }, [map, mapLoaded, data]);

  // ─── Setup layer ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!map || !mapLoaded || !dataFeatureSet) return;

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
    const admin0SourceLayer =
      (import.meta.env.VITE_ADMIN0_TILES_SOURCE_LAYER as string | undefined) ||
      "admin0";
    const admin1SourceLayer =
      (import.meta.env.VITE_ADMIN1_TILES_SOURCE_LAYER as string | undefined) ||
      "admin1";
    const admin2SourceLayer =
      (import.meta.env.VITE_ADMIN2_TILES_SOURCE_LAYER as string | undefined) ||
      "admin2";
    const admin0PromoteId =
      (import.meta.env.VITE_ADMIN0_TILES_PROMOTE_ID as string | undefined) ||
      "areaID";
    const admin1PromoteId =
      (import.meta.env.VITE_ADMIN1_TILES_PROMOTE_ID as string | undefined) ||
      "areaID";
    const admin2PromoteId =
      (import.meta.env.VITE_ADMIN2_TILES_PROMOTE_ID as string | undefined) ||
      "areaID";
    const activeTilesConfig =
      adminLevel === 0 && admin0TilesUrl
        ? {
            url: admin0TilesUrl,
            sourceLayer: admin0SourceLayer,
            promoteId: admin0PromoteId,
          }
        : adminLevel === 1 && admin1TilesUrl
          ? {
              url: admin1TilesUrl,
              sourceLayer: admin1SourceLayer,
              promoteId: admin1PromoteId,
            }
          : adminLevel === 2 && admin2TilesUrl
            ? {
                url: admin2TilesUrl,
                sourceLayer: admin2SourceLayer,
                promoteId: admin2PromoteId,
              }
            : null;
    const useTiles = !!activeTilesConfig;

    // Keep refs in sync so other effects can read them
    useTilesRef.current = useTiles;
    activeTilesConfigRef.current = activeTilesConfig;

    const setupLayer = async () => {
      try {
        const dataUnion = data as (CountryData | StateData | RegionalData)[];

        const boundaries: FeatureCollection | null = !useTiles
          ? {
              type: "FeatureCollection",
              features: dataUnion.map((d) => ({
                type: "Feature" as const,
                id: d.areaId,
                geometry: d.geometry as any,
                properties: {
                  shapeGroup: d.countryCode,
                  shapeName: d.name,
                  shapeType: `ADMIN`,
                  areaName: d.name,
                  labelName:
                    d.name?.startsWith("Other (") && d.name?.endsWith(")")
                      ? d.name.slice("Other (".length, -1)
                      : d.name,
                  countryCode: d.countryCode,
                  areaId: d.areaId,
                  lat: d.lat,
                  long: d.long,
                  bounds_w: d.bounds[0],
                  bounds_s: d.bounds[1],
                  bounds_e: d.bounds[2],
                  bounds_n: d.bounds[3],
                },
              })),
            }
          : null;

        const sourceId = `adminSource`;
        const sourceLayerProps = useTiles
          ? ({ "source-layer": activeTilesConfig!.sourceLayer } as const)
          : {};
        const featureStateTarget = (id: string | number) =>
          useTiles
            ? {
                source: sourceId,
                sourceLayer: activeTilesConfig!.sourceLayer,
                id,
              }
            : { source: sourceId, id };

        // Remove layers before re-adding so they always reflect current adminLevel and data
        const layersToRemove = [
          "adminJoinLabels",
          "adminJoinOtherStripe",
          "adminJoinBorder",
          "adminJoin",
          "adminJoinEmpty",
        ];
        for (const layerId of layersToRemove) {
          if (map.getLayer(layerId)) map.removeLayer(layerId);
        }

        const currentSource = map.getSource(sourceId) as any;
        const currentSourceType = currentSource?.type;
        const expectedSourceType = useTiles ? "vector" : "geojson";
        const styleSource = map.getStyle().sources?.[sourceId] as any;
        const activeTileUrl = activeTilesConfig?.url;
        const currentTileUrl = styleSource?.tiles?.[0];
        const currentPromoteId = styleSource?.promoteId;
        const shouldRecreateVectorSource =
          useTiles &&
          currentSource &&
          currentSourceType === "vector" &&
          (currentTileUrl !== activeTileUrl ||
            currentPromoteId !== activeTilesConfig?.promoteId);

        if (
          currentSource &&
          (currentSourceType !== expectedSourceType ||
            shouldRecreateVectorSource)
        ) {
          map.removeSource(sourceId);
        }

        if (useTiles) {
          if (!map.getSource(sourceId)) {
            map.addSource(sourceId, {
              type: "vector",
              tiles: [activeTilesConfig!.url],
              promoteId: activeTilesConfig!.promoteId,
            } as any);
          }
        } else if (map.getSource(sourceId)) {
          (map.getSource(sourceId) as any).setData(boundaries);
        } else {
          map.addSource(sourceId, {
            type: "geojson",
            data: boundaries as FeatureCollection,
            promoteId: "areaId",
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
          ["stripe-empty", ChoroplethMapColors.empty],
          ["stripe-level1", ChoroplethMapColors.level1],
          ["stripe-level2", ChoroplethMapColors.level2],
          ["stripe-level3", ChoroplethMapColors.level3],
          ["stripe-level4", ChoroplethMapColors.level4],
          ["stripe-level5", ChoroplethMapColors.level5],
          ["stripe-level6", ChoroplethMapColors.level6],
        ];
        for (const [name, color] of stripePatternEntries) {
          if (!map.hasImage(name)) {
            const size = 10;
            const canvas = document.createElement("canvas");
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext("2d")!;
            ctx.clearRect(0, 0, size, size);
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, size);
            ctx.lineTo(size, 0);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, 0);
            ctx.moveTo(-size / 2, size / 2);
            ctx.lineTo(size / 2, -size / 2);
            ctx.stroke();
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
          .layers?.find((layer) => layer.type === "symbol")?.id;

        const areaIdsFromData = dataUnion
          .filter((area) => !!area.areaId)
          .map((area) => String(area.areaId));
        const otherAreaIdsFromData = dataUnion
          .filter(
            (area) =>
              !!area.areaId &&
              String(area.areaId).startsWith("COD.HEALTH ZONE.OTHER"),
          )
          .map((area) => String(area.areaId));
        const otherAreaIdsWithCasesFromData = dataUnion
          .filter(
            (area) =>
              !!area.areaId &&
              String(area.areaId).startsWith("COD.HEALTH ZONE.OTHER") &&
              area.caseCount > 0,
          )
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

        const otherAreaIdsByStripeLevel = {
          level1: [] as string[],
          level2: [] as string[],
          level3: [] as string[],
          level4: [] as string[],
          level5: [] as string[],
          level6: [] as string[],
        };

        for (const area of dataUnion) {
          if (!area.areaId) continue;
          const areaId = String(area.areaId);
          if (!areaId.startsWith("COD.HEALTH ZONE.OTHER")) continue;
          const caseCount = area.caseCount ?? 0;
          if (caseCount <= 0) continue;

          if (caseCount <= dataLayerBounds.level1.upper.number) {
            otherAreaIdsByStripeLevel.level1.push(areaId);
          } else if (caseCount <= dataLayerBounds.level2.upper.number) {
            otherAreaIdsByStripeLevel.level2.push(areaId);
          } else if (caseCount <= dataLayerBounds.level3.upper.number) {
            otherAreaIdsByStripeLevel.level3.push(areaId);
          } else if (caseCount <= dataLayerBounds.level4.upper.number) {
            otherAreaIdsByStripeLevel.level4.push(areaId);
          } else if (caseCount <= dataLayerBounds.level5.upper.number) {
            otherAreaIdsByStripeLevel.level5.push(areaId);
          } else {
            otherAreaIdsByStripeLevel.level6.push(areaId);
          }
        }

        const stripePatternExpression = [
          "case",
          [
            "in",
            areaIdExpression,
            ["literal", otherAreaIdsByStripeLevel.level1],
          ],
          "stripe-level1",
          [
            "in",
            areaIdExpression,
            ["literal", otherAreaIdsByStripeLevel.level2],
          ],
          "stripe-level2",
          [
            "in",
            areaIdExpression,
            ["literal", otherAreaIdsByStripeLevel.level3],
          ],
          "stripe-level3",
          [
            "in",
            areaIdExpression,
            ["literal", otherAreaIdsByStripeLevel.level4],
          ],
          "stripe-level4",
          [
            "in",
            areaIdExpression,
            ["literal", otherAreaIdsByStripeLevel.level5],
          ],
          "stripe-level5",
          [
            "in",
            areaIdExpression,
            ["literal", otherAreaIdsByStripeLevel.level6],
          ],
          "stripe-level6",
          "stripe-empty",
        ];

        const shouldShowBorderExpression = [
          "in",
          areaIdExpression,
          ["literal", areaIdsFromData],
        ];

        map.addLayer(
          {
            id: "adminJoinOtherStripe",
            type: "fill",
            source: sourceId,
            ...sourceLayerProps,
            filter: [
              "in",
              areaIdExpression,
              ["literal", otherAreaIdsWithCasesFromData],
            ],
            paint: {
              "fill-pattern": stripePatternExpression,
            },
          } as any,
          firstSymbolLayer,
        );

        map.addLayer(
          {
            id: `adminJoin`,
            type: "fill",
            source: sourceId,
            ...sourceLayerProps,
            filter: [
              "all",
              [
                "!",
                ["in", areaIdExpression, ["literal", otherAreaIdsFromData]],
              ],
            ],
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
        if (handlersRef.current.clickOther)
          map.off(
            "click",
            "adminJoinOtherStripe",
            handlersRef.current.clickOther,
          );
        if (handlersRef.current.mousemoveOther)
          map.off(
            "mousemove",
            "adminJoinOtherStripe",
            handlersRef.current.mousemoveOther,
          );
        if (handlersRef.current.mouseleaveOther)
          map.off(
            "mouseleave",
            "adminJoinOtherStripe",
            handlersRef.current.mouseleaveOther,
          );

        const getSpatialPropsFromFeature = (feature: any) =>
          getSpatialPropsFromTileFeature(feature);

        const clickHandler = (e: any) => {
          const feature = e.features?.[0];
          console.log(e.features);
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
          console.log("AAAA", feature);

          if ((featureState?.caseCount ?? 0) === 0) return;

          const name = String(areaName);
          const areaId = String(featureId);
          const countryCode =
            props.countryCode || props.country_code || props.shapeGroup;

          // Read spatial metadata from tile properties when in tile mode
          const spatialFromTile = useTiles
            ? getSpatialPropsFromFeature(feature)
            : null;

          suppressPopupCloseRef.current = true;
          if (currentPopupRef.current) {
            currentPopupRef.current.remove();
            currentPopupRef.current = null;
          }
          suppressPopupCloseRef.current = false;
          console.log("DDDDD", featureState);

          dispatch(
            setFocusedArea({
              name,
              areaId,
              countryCode,
              // Tile-derived spatial data; the fly-to effect prefers these over Redux data
              ...(spatialFromTile ?? {}),
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

        const hasClickableAdminJoinFeatureAtPoint = (point: any) => {
          const featuresAtPoint = map.queryRenderedFeatures(point, {
            layers: ["adminJoin"],
          });
          for (const f of featuresAtPoint) {
            const p = f?.properties || {};
            const fid = p.areaId || p.areaID || p.area_id || f.id;
            if (!fid) continue;
            const fs = map.getFeatureState(featureStateTarget(fid)) as {
              caseCount?: number;
            };
            if ((fs?.caseCount ?? 0) > 0) return true;
          }
          return false;
        };

        const clickOtherHandler = (e: any) => {
          if (hasClickableAdminJoinFeatureAtPoint(e.point)) return;
          clickHandler(e);
        };

        const mousemoveOtherHandler = (e: any) => {
          if (hasClickableAdminJoinFeatureAtPoint(e.point)) return;
          mousemoveHandler(e);
        };

        const mouseleaveOtherHandler = () => mouseleaveHandler();

        map.on("click", "adminJoin", clickHandler);
        map.on("mousemove", "adminJoin", mousemoveHandler);
        map.on("mouseleave", "adminJoin", mouseleaveHandler);
        map.on("click", "adminJoinOtherStripe", clickOtherHandler);
        map.on("mousemove", "adminJoinOtherStripe", mousemoveOtherHandler);
        map.on("mouseleave", "adminJoinOtherStripe", mouseleaveOtherHandler);

        if (isCancelled) {
          map.off("click", "adminJoin", clickHandler);
          map.off("mousemove", "adminJoin", mousemoveHandler);
          map.off("mouseleave", "adminJoin", mouseleaveHandler);
          map.off("click", "adminJoinOtherStripe", clickOtherHandler);
          map.off("mousemove", "adminJoinOtherStripe", mousemoveOtherHandler);
          map.off("mouseleave", "adminJoinOtherStripe", mouseleaveOtherHandler);
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
        console.error("Failed to load geoBoundaries:", error);
      }
    };

    setupLayer();

    // ─── Populate spatial cache as tiles load ───────────────────────────────
    // querySourceFeatures only returns features in currently loaded tiles.
    // By listening to `sourcedata` we accumulate spatial props (lat/long/bounds)
    // for every feature we ever see, so sidebar selections for off-screen areas
    // can still pan the map correctly.
    const populateSpatialCache = () => {
      if (!useTiles || !activeTilesConfig) return;
      const features = map.querySourceFeatures("adminSource", {
        sourceLayer: activeTilesConfig.sourceLayer,
      });
      for (const f of features) {
        const props = f.properties || {};
        const fid = String(
          props.areaID ?? props.areaId ?? props.area_id ?? "",
        );
        if (!fid || tileFeatureCacheRef.current[fid]) continue;
        const spatial = getSpatialPropsFromTileFeature(f);
        if (spatial) tileFeatureCacheRef.current[fid] = spatial;
      }
    };

    if (useTiles) {
      map.on("sourcedata", populateSpatialCache);
      // Also run once immediately in case tiles are already loaded
      populateSpatialCache();
    }

    return () => {
      isCancelled = true;
      if (useTiles) map.off("sourcedata", populateSpatialCache);
      const {
        click,
        mousemove,
        mouseleave,
        clickOther,
        mousemoveOther,
        mouseleaveOther,
      } = handlersRef.current;
      if (map) {
        if (click) map.off("click", "adminJoin", click);
        if (mousemove) map.off("mousemove", "adminJoin", mousemove);
        if (mouseleave) map.off("mouseleave", "adminJoin", mouseleave);
        if (clickOther) map.off("click", "adminJoinOtherStripe", clickOther);
        if (mousemoveOther)
          map.off("mousemove", "adminJoinOtherStripe", mousemoveOther);
        if (mouseleaveOther)
          map.off("mouseleave", "adminJoinOtherStripe", mouseleaveOther);
      }
      handlersRef.current = {
        click: null,
        mousemove: null,
        mouseleave: null,
        clickOther: null,
        mousemoveOther: null,
        mouseleaveOther: null,
      };

      if (map) {
        for (const id of previousFeatureStateIdsRef.current) {
          map.removeFeatureState(
            useTiles
              ? {
                  source: "adminSource",
                  sourceLayer: activeTilesConfig!.sourceLayer,
                  id,
                }
              : { source: "adminSource", id },
          );
        }
      }
      previousFeatureStateIdsRef.current = [];
    };
  }, [
    map,
    mapLoaded,
    data,
    adminLevel,
    dataFeatureSet,
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

  // ─── Fly to area / show popup ─────────────────────────────────────────────
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
      console.log("found area", focusedArea);
      // Prefer spatial data from FocusedArea (tile properties), then Redux fallback.
      let lat = Number(focusedArea.lat ?? foundArea.lat);
      let long = Number(focusedArea.long ?? foundArea.long);
      const boundsCandidate = focusedArea.bounds ?? foundArea.bounds;
      let bounds: [number, number, number, number] | null =
        Array.isArray(boundsCandidate) && boundsCandidate.length === 4
          ? (boundsCandidate as [number, number, number, number])
          : null;

      // When bounds are not available from Redux data (common with vector tiles),
      // first check the spatial cache (populated as tiles load), then fall back
      // to querySourceFeatures for currently rendered tiles.
      if (
        !bounds &&
        map &&
        useTilesRef.current &&
        activeTilesConfigRef.current
      ) {
        // 1. Check the persistent cache — works even if the area is off-screen
        const cached = tileFeatureCacheRef.current[areaId];
        if (cached) {
          bounds = cached.bounds;
          if (!Number.isFinite(lat)) lat = cached.lat;
          if (!Number.isFinite(long)) long = cached.long;
        } else {
          // 2. Fall back to querying currently loaded tiles
          const sourceLayer = activeTilesConfigRef.current.sourceLayer;
          const features = map.querySourceFeatures("adminSource", {
            sourceLayer,
          });
          const matchingFeature = features.find((f) => {
            const props = f.properties || {};
            const fid = String(
              props.areaID ?? props.areaId ?? props.area_id ?? "",
            );
            return fid === areaId;
          });
          if (matchingFeature) {
            const spatial = getSpatialPropsFromTileFeature(matchingFeature);
            if (spatial) {
              // Store in cache for next time
              tileFeatureCacheRef.current[areaId] = spatial;
              bounds = spatial.bounds;
              if (!Number.isFinite(lat)) lat = spatial.lat;
              if (!Number.isFinite(long)) long = spatial.long;
            }
          }
        }
      }

      const lastUploadDate = convertStringDateToDate(foundArea.lastUpdated);
      const popupTitle = foundArea.name;

      if (bounds) {
        map?.fitBounds(bounds, { padding: 150 });
      } else if (Number.isFinite(lat) && Number.isFinite(long) && map) {
        // Fallback: fly to the centroid if no bounds are available
        map.flyTo({ center: [long, lat], zoom: 6 });
      }

      const popupContent = (
        <PopupContentText>
          {foundArea.caseCount.toLocaleString()} confirmed case
          {foundArea.caseCount > 1 ? "s" : ""}
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
            .setLngLat([
              Number.isFinite(long) ? long : 0,
              Number.isFinite(lat) ? lat : 0,
            ])
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
            .setLngLat([
              Number.isFinite(long) ? long : 0,
              Number.isFinite(lat) ? lat : 0,
            ])
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
