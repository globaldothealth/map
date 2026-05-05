import { createSlice } from '@reduxjs/toolkit';
import { StateData } from 'src/models/StateData';
import { fetchStateData } from 'src/redux/State/thunks';

interface StateState {
    isLoading: boolean;
    stateData: StateData[];
    totalNumberOfCases: number;
    lastUpdateDate: string;
}

const initialState: StateState = {
    isLoading: false,
    stateData: [],
    totalNumberOfCases: 0,
    lastUpdateDate: '',
};

const stateSlice = createSlice({
    name: 'state',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(fetchStateData.pending, (state) => {
            state.isLoading = true;
        });
        builder.addCase(fetchStateData.fulfilled, (state, { payload }) => {
            state.isLoading = false;
            state.stateData = payload.stateData;
            state.totalNumberOfCases = payload.totalNumberOfCases;
            state.lastUpdateDate = payload.lastUpdateDate;
        });
        builder.addCase(fetchStateData.rejected, (state) => {
            state.isLoading = false;
        });
    },
});

export default stateSlice.reducer;
