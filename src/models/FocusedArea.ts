export interface FocusedArea {
  name: string;
  areaId: string;
  countryCode: string;
  lat?: number;
  long?: number;
  bounds?: [number, number, number, number];
}
