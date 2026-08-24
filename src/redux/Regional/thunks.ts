import {createAsyncThunk} from '@reduxjs/toolkit';
import { getUrl } from 'aws-amplify/storage';

import {RegionalData} from 'src/models/RegionalData';
import {fetchCasesData, FetchedCaseData} from "src/redux/fetchCasesData";
import { RootState } from 'src/redux/store';
import { OutbreakNames } from 'src/redux/App/slice';

const mapToRegionalData = (cases: FetchedCaseData[]): RegionalData[]  => {
    return cases.map((fetchedCase: any) => {
        return {
            caseCount: fetchedCase.case_count,
            countryCode: fetchedCase.id.split('.')[0],
            areaId: fetchedCase.id,
            name: fetchedCase.name,
            lastUpdated: fetchedCase.last_updated,
        };
    })
}

export const fetchRegionalData = createAsyncThunk<
    {
        regionalData: RegionalData[],
        totalNumberOfCases: number;
        lastUpdateDate: string;
        outbreakName: keyof typeof OutbreakNames;
    },
    void,
    { rejectValue: string, state: RootState }
>('regional/fetchRegionalData', async (_, {rejectWithValue, getState}) => {
    const outbreakName = getState().app.outbreakName;
    const s3Path = `outbreaks/${OutbreakNames[outbreakName]}/admin2/latest.json`;

    try {
        const { url } = await getUrl({ path: s3Path, options: { bucket: { bucketName: 'aggregated-map-data', region: 'eu-central-1' } } });
        const fetchedCases = await fetchCasesData(url.toString());
        const regionalData = mapToRegionalData(fetchedCases);

        if (regionalData.length === 0) {
            return {
                regionalData: [],
                totalNumberOfCases: 0,
                lastUpdateDate: '',
                outbreakName,
            };
        }

        let totalNumberOfCases = 0;
        let lastUpdateDate = regionalData[0].lastUpdated;
        for (const result of regionalData) {
            totalNumberOfCases += result.caseCount;
            if (result.lastUpdated > lastUpdateDate) {
                lastUpdateDate = result.lastUpdated;
            }
        }

        return { regionalData, totalNumberOfCases, lastUpdateDate, outbreakName };
    } catch (error: any) {
        if (!error.response) throw error;

        return rejectWithValue(error.response.message);
    }
});

export const fetchRegionalMetadata = createAsyncThunk<any, void, { rejectValue: string }>('regional/fetchCountriesMetadata', async (_, { rejectWithValue }) => {
    const s3Path = `metadata/health_zone.json`;
    try {
        const { url } = await getUrl({ path: s3Path, options: { bucket: { bucketName: 'aggregated-map-data', region: 'eu-central-1' } } });
        return await fetch(url.toString()).then(res => res.json());
    } catch (err: any) {
        console.log('ERR', err);
        if (err.response) return rejectWithValue(err.response.message);
        throw err;
    }
});
