import { createAsyncThunk } from '@reduxjs/toolkit';
import { getUrl } from 'aws-amplify/storage';

import { fetchCasesData, FetchedCaseData } from 'src/redux/fetchCasesData';
import { RootState } from 'src/redux/store';
import { OutbreakNames } from 'src/redux/App/slice';

const mapToAppData = (
    cases: FetchedCaseData[],
): { caseCount: number; lastUpdated: string }[] => {
    return cases.map((fetchedCase: any) => {
        return {
            caseCount: fetchedCase.case_count,
            lastUpdated: fetchedCase.last_updated,
        };
    });
};

export const fetchAppData = createAsyncThunk<
    { totalNumberOfCases: number; lastUpdateDate: string },
    void,
    { rejectValue: string, state: RootState }
>('app/fetchAppData', async (_, { rejectWithValue, getState }) => {
    const outbreakName = getState().app.outbreakName;
    const s3Path = `outbreaks/${OutbreakNames[outbreakName]}/admin0/simplified.json`;
    try {
        const { url } = await getUrl({ path: s3Path });

        const fetchedCases = await fetchCasesData(url.toString());
        const appData = mapToAppData(fetchedCases);
        let totalNumberOfCases = 0;
        let lastUpdateDate = appData[0].lastUpdated;
        for (const result of appData) {
            totalNumberOfCases += result.caseCount;
            if (result.lastUpdated > lastUpdateDate) {
                lastUpdateDate = result.lastUpdated;
            }
        }

        return { totalNumberOfCases, lastUpdateDate };
    } catch (err: any) {
        if (err.response) return rejectWithValue(err.response.message);
        throw err;
    }
});
