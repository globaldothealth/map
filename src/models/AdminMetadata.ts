import { LngLatBoundsLike } from "maplibre-gl";

export interface AdminMetadataEntry {
  name: string;
  long: number;
  lat: number;
  bounds: LngLatBoundsLike;
  size: number;
}
export interface AdminMetadata {
  [key: string]: AdminMetadataEntry;
}
