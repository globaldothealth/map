export enum ChartTypeNames {
    Country = 'country',
    State = 'state',
    Regional = 'regional',
}

export interface ViewParamURLValues {
    name?: string;
    lng?: number;
    lat?: number;
    zoom?: number;
    chartType?: ChartTypeNames;
    focusedArea?: string;
}
