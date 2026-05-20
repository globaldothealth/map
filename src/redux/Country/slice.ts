import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {fetchCountriesData} from 'src/redux/Country/thunks';
import {CountryData} from 'src/models/CountryData';

export enum DataType {
    Confirmed,
    Combined,
}

interface AppState {
    isLoading: boolean;
    countriesData: CountryData[];
    confirmedCaseCount: number;
    probableCaseCount: number;
    lastUpdateDate: string;
    dataType: DataType;

}

const initialState: AppState = {
    isLoading: false,
    countriesData: [],
    confirmedCaseCount: 8,
    probableCaseCount: 2,
    lastUpdateDate: '',
    dataType: DataType.Confirmed,
};



export const countrySlice = createSlice({
    name: 'country',
    initialState,
    reducers: {        setDataType: (state, action: PayloadAction<DataType>) => {
            state.dataType = action.payload;
        },},
    extraReducers: (builder) => {
        builder.addCase(fetchCountriesData.pending, (state) => {
            state.isLoading = true;
        });
        builder.addCase(fetchCountriesData.fulfilled, (state, {payload }) => {
            state.isLoading = false;
            state.countriesData = payload.countriesData;
            state.confirmedCaseCount = payload.confirmedCaseCount;
            state.probableCaseCount = payload.probableCaseCount;
            state.lastUpdateDate = payload.lastUpdateDate;
        });
        builder.addCase(fetchCountriesData.rejected, (state) => {
            state.isLoading = false;
        });
    },
});

export const {setDataType} = countrySlice.actions;

export default countrySlice.reducer;
