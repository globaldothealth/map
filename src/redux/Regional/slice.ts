import { createSlice } from '@reduxjs/toolkit';
import { RegionalData } from 'src/models/RegionalData';
import { fetchRegionalData } from 'src/redux/Regional/thunks';

interface RegionalState {
    isLoading: boolean;
    regionalData: RegionalData[];
    totalNumberOfCases: number;
    lastUpdateDate: string;
}

const initialState: RegionalState = {
    isLoading: false,
    regionalData: [],
    totalNumberOfCases: 0,
    lastUpdateDate: '',
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
            state.regionalData = payload.regionalData;
            state.totalNumberOfCases = payload.totalNumberOfCases;
            state.lastUpdateDate = payload.lastUpdateDate;
        });
        builder.addCase(fetchRegionalData.rejected, (state) => {
            state.isLoading = false;
        });
    },
});

export default regionalSlice.reducer;
