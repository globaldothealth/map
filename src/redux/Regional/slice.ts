import { createSlice } from '@reduxjs/toolkit';
import { RegionalData } from 'src/models/RegionalData';
import { fetchRegionalData } from 'src/redux/Regional/thunks';
import {OutbreakNames} from "src/redux/App/slice.ts";

interface RegionalState {
    isLoading: boolean;
    regionalData: Record<OutbreakNames, RegionalData[]>;
    totalNumberOfCases: Record<OutbreakNames, number>;
    lastUpdateDate: Record<OutbreakNames, string>;
}

const initialState: RegionalState = {
    isLoading: false,
    regionalData: Object.values(OutbreakNames).reduce(
        (acc, name) => ({ ...acc, [name]: [] }),
        {} as Record<OutbreakNames, RegionalData[]>,
    ),
    totalNumberOfCases: Object.values(OutbreakNames).reduce(
        (acc, name) => ({ ...acc, [name]: 0 }),
        {} as Record<OutbreakNames, number>,
    ),
    lastUpdateDate: Object.values(OutbreakNames).reduce(
        (acc, name) => ({ ...acc, [name]: '' }),
        {} as Record<OutbreakNames, string>,
    ),
};

const regionalSlice = createSlice({
    name: 'regional',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(fetchRegionalData.pending, (state) => {
            state.isLoading = true;
        });
        builder.addCase(fetchRegionalData.fulfilled, (state, { payload }) => {
            state.isLoading = false;
            const outbreakKey = OutbreakNames[payload.outbreakName as keyof typeof OutbreakNames];
            state.regionalData[outbreakKey] = payload.regionalData;
            state.totalNumberOfCases[outbreakKey] = payload.totalNumberOfCases;
            state.lastUpdateDate[outbreakKey] = payload.lastUpdateDate;
        });
        builder.addCase(fetchRegionalData.rejected, (state) => {
            state.isLoading = false;
        });
    },
});

export default regionalSlice.reducer;
