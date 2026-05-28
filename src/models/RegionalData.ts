import { MultiPolygon, Polygon } from 'geojson';

export interface RegionalData {
    areaId: string;
    countryCode: string;
    caseCount: number;
    name: string;
    lastUpdated: string;
    lat: number;
    long: number;
    bounds: [number, number, number, number];
    geometry: Polygon | MultiPolygon;
}
