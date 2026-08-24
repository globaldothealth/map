import {LngLatBoundsLike} from "maplibre-gl";

export interface AdminMetadata {[key: string]: {name: string, long: number, lat: number, bounds: LngLatBoundsLike}}