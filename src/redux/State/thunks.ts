import { createAsyncThunk } from '@reduxjs/toolkit';
import { getUrl } from 'aws-amplify/storage';
import { StateData } from 'src/models/StateData';
import { fetchCasesData, FetchedCaseData } from 'src/redux/fetchCasesData';
import { RootState } from 'src/redux/store';
import { OutbreakNames } from 'src/redux/App/slice';

const mapToStateData = (cases: FetchedCaseData[]): StateData[] => {
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

export const fetchStateData = createAsyncThunk<
    {
        stateData: StateData[];
        totalNumberOfCases: number;
        lastUpdateDate: string;
    },
    void,
    { rejectValue: string, state: RootState }
>('state/fetchStateData', async (_, { rejectWithValue, getState }) => {
    const outbreakName = getState().app.outbreakName;
    const s3Path = `outbreaks/${OutbreakNames[outbreakName]}/admin1/simplified.json`;

    try {
        const { url } = await getUrl({ path: s3Path });

        const fetchedCases = await fetchCasesData(url.toString());
        const stateData = mapToStateData(fetchedCases);

        let totalNumberOfCases = 0;
        let lastUpdateDate = fetchedCases[0].last_updated;
        for (const result of stateData) {
            totalNumberOfCases += result.caseCount;
            if (result.lastUpdated > lastUpdateDate) {
                lastUpdateDate = result.lastUpdated;
            }
        }

        return { stateData, totalNumberOfCases, lastUpdateDate };
    } catch (error: any) {
        console.error(error);
        if (!error.response) throw error;
        return rejectWithValue(error.response.message);
    }
});
