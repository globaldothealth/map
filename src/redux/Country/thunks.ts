import { createAsyncThunk } from '@reduxjs/toolkit';
import { getUrl } from 'aws-amplify/storage';

import { CountryData } from 'src/models/CountryData';
import { fetchCasesData, FetchedCaseData } from 'src/redux/fetchCasesData';
import { RootState } from 'src/redux/store';
import { OutbreakNames } from 'src/redux/App/slice';

const mapToCountryData = (cases: FetchedCaseData[]): CountryData[] => {
    return cases.map((fetchedCase: any) => {
        return {
            caseCount: fetchedCase.case_count,
            countryCode: fetchedCase.country_code,
            areaId: fetchedCase.id,
            name: fetchedCase.name,
            lastUpdated: fetchedCase.last_updated,
            lat: fetchedCase.lat,
            long: fetchedCase.long,
            bounds: fetchedCase.bounds,
            geometry: fetchedCase.geometry,
        };
    });
};

export const fetchCountriesData = createAsyncThunk<
    {
        countriesData: CountryData[];
        totalNumberOfCases: number;
        lastUpdateDate: string;
    },
    void,
    { rejectValue: string; state: RootState }
>('country/fetchCountriesData', async (_, { rejectWithValue, getState }) => {
    const outbreakName = getState().app.outbreakName;
    const s3Path = `outbreaks/${OutbreakNames[outbreakName]}/admin0/simplified.json`;
    try {
        const { url } = await getUrl({ path: s3Path });
        const fetchedCases = await fetchCasesData(url.toString());
        const countriesData = mapToCountryData(fetchedCases);
        if (countriesData.length === 0) {
            return {
                countriesData: [],
                totalNumberOfCases: 0,
                lastUpdateDate: '',
            };
        }
        let totalNumberOfCases = 0;
        let lastUpdateDate = countriesData[0].lastUpdated;
        for (const result of countriesData) {
            totalNumberOfCases += result.caseCount;
            if (result.lastUpdated > lastUpdateDate) {
                lastUpdateDate = result.lastUpdated;
            }
        }

        return { countriesData, totalNumberOfCases, lastUpdateDate };
    } catch (err: any) {
        console.log(err)
        if (err.response) return rejectWithValue(err.response.message);
        throw err;
    }
});
