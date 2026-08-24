import { format, parseISO } from 'date-fns';
import iso from 'iso-3166-1';
import { ViewParamURLValues } from 'src/models/ViewParamURLValues';
import { ChoroplethMapColors } from 'src/models/Colors';
import { LegendRow } from 'src/models/LegendRow';


export const convertStringDateToDate = (date: string) => {
    let finalDate;
    try {
        finalDate = format(parseISO(date), 'E LLL d yyyy');
    } catch (e) {
        finalDate = 'unknown';
    }

    return finalDate;
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
            label: bounds.level1.lower.text === bounds.level1.upper.text ? bounds.level1.upper.text : `${bounds.level1.lower.text}-${bounds.level1.upper.text}`,
            color: ChoroplethMapColors.level1,
        },
        {
            label: bounds.level2.lower.text === bounds.level2.upper.text ? bounds.level2.upper.text : `${bounds.level2.lower.text}-${bounds.level2.upper.text}`,
            color: ChoroplethMapColors.level2,
        },
        {
            label: bounds.level3.lower.text === bounds.level3.upper.text ? bounds.level3.upper.text : `${bounds.level3.lower.text}-${bounds.level3.upper.text}`,
            color: ChoroplethMapColors.level3,
        },
        {
            label: bounds.level4.lower.text === bounds.level4.upper.text ? bounds.level4.upper.text : `${bounds.level4.lower.text}-${bounds.level4.upper.text}`,
            color: ChoroplethMapColors.level4,
        },
        {
            label: bounds.level5.lower.text === bounds.level5.upper.text ? bounds.level5.upper.text : `${bounds.level5.lower.text}-${bounds.level5.upper.text}`,
            color: ChoroplethMapColors.level5,
        },
        {
            label: `> ${bounds.level5.upper.text}`,
            color: ChoroplethMapColors.level6,
        },
    ];
};
