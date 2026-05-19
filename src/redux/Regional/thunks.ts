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
            countryCode: fetchedCase.country_code,
            areaId: fetchedCase.id,
            name: fetchedCase.name,
            lastUpdated: fetchedCase.last_updated,
            lat: fetchedCase.lat,
            long: fetchedCase.long,
            bounds: fetchedCase.bounds,
            geometry: fetchedCase.geometry,
            status: fetchedCase.status,
        };
    })
}

export const fetchRegionalData = createAsyncThunk<
    {regionalData: RegionalData[],         totalNumberOfCases: number;
        lastUpdateDate: string;
    },
    void,
    { rejectValue: string, state: RootState }
>('regional/fetchRegionalData', async (_, {rejectWithValue, getState}) => {
    const outbreakName = getState().app.outbreakName;
    const s3Path = `outbreaks/${OutbreakNames[outbreakName]}/admin2/simplified.json`;

    try {
        const { url } = await getUrl({ path: s3Path, options: { bucket: { bucketName: 'aggregated-map-data', region: 'eu-central-1' } } });
        const fetchedCases = await fetchCasesData(url.toString());
        const regionalData = mapToRegionalData(fetchedCases);

        let totalNumberOfCases = 0;
        let lastUpdateDate = fetchedCases[0].last_updated;
        for (const result of regionalData) {
            totalNumberOfCases += result.caseCount;
            if (result.lastUpdated > lastUpdateDate) {
                lastUpdateDate = result.lastUpdated;
            }
        }

        return { regionalData, totalNumberOfCases, lastUpdateDate };
    } catch (error: any) {
        if (!error.response) throw error;

        return rejectWithValue(error.response.message);
    }
});
