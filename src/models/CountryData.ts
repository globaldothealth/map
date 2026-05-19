import { Polygon, MultiPolygon } from 'geojson';

export interface CountryData {
    areaId: string;
    caseCount: number;
    countryCode: string;
    lat: number;
    long: number;
    lastUpdated: string;
    name: string;
    bounds: [number, number, number, number];
    geometry: Polygon | MultiPolygon;
    status: string;
}
