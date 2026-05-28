import {createSlice} from '@reduxjs/toolkit';
import {StateData} from 'src/models/StateData';
import {fetchStateData} from 'src/redux/State/thunks';
import {OutbreakNames} from "src/redux/App/slice.ts";

interface StateState {
    isLoading: boolean;
    stateData: Record<OutbreakNames, StateData[]>;
    totalNumberOfCases: Record<OutbreakNames, number>;
    lastUpdateDate: Record<OutbreakNames, string>;
}

const initialState: StateState = {
    isLoading: false,
    stateData: Object.values(OutbreakNames).reduce(
        (acc, name) => ({...acc, [name]: []}),
        {} as Record<OutbreakNames, StateData[]>,
    ),
    totalNumberOfCases: Object.values(OutbreakNames).reduce(
        (acc, name) => ({...acc, [name]: 0}),
        {} as Record<OutbreakNames, number>,
    ),
    lastUpdateDate: Object.values(OutbreakNames).reduce(
        (acc, name) => ({...acc, [name]: ''}),
        {} as Record<OutbreakNames, string>,
    ),
};

const stateSlice = createSlice({
    name: 'state',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(fetchStateData.pending, (state) => {
            state.isLoading = true;
        });
        builder.addCase(fetchStateData.fulfilled, (state, {payload}) => {
            state.isLoading = false;
            const outbreakKey = OutbreakNames[payload.outbreakName as keyof typeof OutbreakNames];
            state.stateData[outbreakKey] = payload.stateData;
            state.totalNumberOfCases[outbreakKey] = payload.totalNumberOfCases;
            state.lastUpdateDate[outbreakKey] = payload.lastUpdateDate;
        });
        builder.addCase(fetchStateData.rejected, (state) => {
            state.isLoading = false;
        });
    },
});

export default stateSlice.reducer;
