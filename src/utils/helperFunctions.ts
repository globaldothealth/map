import { format, parseISO } from 'date-fns';
import { RegionalData } from 'src/models/RegionalData';
import {
    FeatureCollection,
    Geometry,
    GeoJsonProperties,
    Feature,
} from 'geojson';
import iso from 'iso-3166-1';
import { StateData } from 'src/models/StateData';
import { CountryData } from 'src/models/CountryData';
import { ViewParamURLValues } from 'src/models/ViewParamURLValues';
import { ChoroplethMapColors } from 'src/models/Colors';
import { LegendRow } from 'src/models/LegendRow';

// Country storage has to be converted to GeoJson type in order to be displayed on the map
export const convertCountryDataToFeatureSet = (
    data: CountryData[],
): FeatureCollection<Geometry, GeoJsonProperties> => {
    const featureSet: FeatureCollection<Geometry, GeoJsonProperties> = {
        type: 'FeatureCollection',
        features: [],
    };

    for (const dataRow of data) {
        const feature: Feature<Geometry, GeoJsonProperties> = {
            type: 'Feature',
            properties: {
                caseCount: dataRow.caseCount,
                admin1: undefined,
                admin2: undefined,
                admin3: undefined,
            },
            geometry: {
                type: 'Point',
                coordinates: [dataRow.long, dataRow.lat],
            },
        };

        featureSet.features.push(feature);
    }

    return featureSet;
};

// State storage has to be converted to GeoJSON type in order to be displayed on the map
export const convertStateDataToFeatureSet = (
    data: StateData[],
): FeatureCollection<Geometry, GeoJsonProperties> => {
    const featureSet: FeatureCollection<Geometry, GeoJsonProperties> = {
        type: 'FeatureCollection',
        features: [],
    };

    for (const dataRow of data) {
        const feature: Feature = {
            type: 'Feature',
            properties: {
                caseCount: dataRow.caseCount,
                admin1: undefined,
                admin2: undefined,
                admin3: undefined,
            },
            geometry: {
                type: 'Point',
                coordinates: [dataRow.long, dataRow.lat],
            },
        };

        featureSet.features.push(feature);
    }

    return featureSet;
};

// Regional storage has to be converted to GeoJson type in order to be displayed on the map
export const convertRegionalDataToFeatureSet = (
    data: RegionalData[],
): FeatureCollection<Geometry, GeoJsonProperties> => {
    const featureSet: FeatureCollection<Geometry, GeoJsonProperties> = {
        type: 'FeatureCollection',
        features: [],
    };

    for (const dataRow of data) {
        const feature: Feature = {
            type: 'Feature',
            properties: {
                caseCount: dataRow.caseCount,
                admin1: undefined,
                admin2: undefined,
                admin3: undefined,
            },
            geometry: {
                type: 'Point',
                coordinates: [dataRow.long, dataRow.lat],
            },
        };

        featureSet.features.push(feature);
    }

    return featureSet;
};

export const convertStringDateToDate = (date: string) => {
    let finalDate;
    try {
        finalDate = format(parseISO(date), 'E LLL d yyyy');
    } catch (e) {
        finalDate = 'unknown';
    }

    return finalDate;
};

export const convertStringLatLonToNumeral = (
    latLonString: string,
): [number, number] => {
    const trimmedLatLonString = latLonString.substring(
        1,
        latLonString.length - 1,
    );
    const splitLatLonString = trimmedLatLonString.split(',');
    return [parseFloat(splitLatLonString[0]), parseFloat(splitLatLonString[1])];
};

export const convertStringBoundsToNumeral = (
    boundsString: string,
): [[number, number], [number, number]] => {
    const trimmedLatLonString = boundsString.substring(
        1,
        boundsString.length - 1,
    );
    const splitLatLonString = trimmedLatLonString.split(',');
    return [
        [parseFloat(splitLatLonString[0]), parseFloat(splitLatLonString[1])],
        [parseFloat(splitLatLonString[2]), parseFloat(splitLatLonString[3])],
    ];
};

export const getCountryName = (countryCode: string): string => {
    const countryObj = iso.whereAlpha3(countryCode);

    // Kosovo is not available in the library
    if (countryCode === 'XK') return 'Kosovo';
    if (countryCode === 'TW') return 'Taiwan';

    return countryObj ? countryObj.country : countryCode;
};

export const getCountryISO2 = (countryCode: string): string => {
    // Kosovo is not available in the library
    if (countryCode === 'XKX') return 'XK';
    const countryObj = iso.whereAlpha3(countryCode);

    return countryObj?.alpha2 || '';
};

export const URLToFilters = (url: string): ViewParamURLValues => {
    const isQuery = url.includes('?q=');

    if (isQuery) return {};

    const searchParams = new URLSearchParams(url);
    let filters: ViewParamURLValues = {};

    searchParams.forEach((value, key) => {
        const parsedValue = value.includes('"')
            ? value.replaceAll('"', '')
            : value;

        filters = {
            ...filters,
            [key]: parsedValue,
        };
    });

    return filters;
};

export const getDataLayersFromBounds = (bounds: {
    [key: string]: {
        lower: { number: number; text: string };
        upper: { number: number; text: string };
    };
}): LegendRow[] => {
    return [
        {
            label: '0',
            color: ChoroplethMapColors.empty,
        },
        {
            label: `${bounds.level1.lower.text}-${bounds.level1.upper.text}`,
            color: ChoroplethMapColors.level1,
        },
        {
            label: `${bounds.level2.lower.text}-${bounds.level2.upper.text}`,
            color: ChoroplethMapColors.level2,
        },
        {
            label: `${bounds.level3.lower.text}-${bounds.level3.upper.text}`,
            color: ChoroplethMapColors.level3,
        },
        {
            label: `${bounds.level4.lower.text}-${bounds.level4.upper.text}`,
            color: ChoroplethMapColors.level4,
        },
        {
            label: `${bounds.level5.lower.text}-${bounds.level5.upper.text}`,
            color: ChoroplethMapColors.level5,
        },
        {
            label: `> ${bounds.level5.upper.text}`,
            color: ChoroplethMapColors.level6,
        },
    ];
};
