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
            countryCode: fetchedCase.id.split('.')[0],
            areaId: fetchedCase.id,
            name: fetchedCase.name,
            lastUpdated: fetchedCase.last_updated,
        };
    });
};

export const fetchCountriesData = createAsyncThunk<
    {
        countriesData: CountryData[];
        totalNumberOfCases: number;
        lastUpdateDate: string;
        outbreakName: string;
    },
    void,
    { rejectValue: string; state: RootState }
>('country/fetchCountriesData', async (_, { rejectWithValue, getState }) => {
    const outbreakName = getState().app.outbreakName;
    const s3Path = `outbreaks/${OutbreakNames[outbreakName]}/admin0/latest.json`;
    try {
        const { url } = await getUrl({ path: s3Path, options: { bucket: { bucketName: 'aggregated-map-data', region: 'eu-central-1' } } });
        const fetchedCases = await fetchCasesData(url.toString());
        const countriesData = mapToCountryData(fetchedCases);
        if (countriesData.length === 0) {
            return {
                countriesData: [],
                totalNumberOfCases: 0,
                lastUpdateDate: '',
                outbreakName: outbreakName
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

        return { countriesData, totalNumberOfCases, lastUpdateDate, outbreakName };
    } catch (err: any) {
        console.log('ERR',err)
        if (err.response) return rejectWithValue(err.response.message);
        throw err;
    }
});

export const fetchCountryMetadata = createAsyncThunk<any, void, { rejectValue: string }>('country/fetchCountriesMetadata', async (_, { rejectWithValue }) => {
    const s3Path = `metadata/admin0.json`;
    try {
        const { url } = await getUrl({ path: s3Path, options: { bucket: { bucketName: 'aggregated-map-data', region: 'eu-central-1' } } });
        return await fetch(url.toString()).then(res => res.json());
    } catch (err: any) {
        console.log('ERR', err);
        if (err.response) return rejectWithValue(err.response.message);
        throw err;
    }
});
