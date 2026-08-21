import {createSlice} from '@reduxjs/toolkit';
import {fetchCountriesData, fetchCountryMetadata} from 'src/redux/Country/thunks';
import {CountryData} from 'src/models/CountryData';
import {OutbreakNames} from "src/redux/App/slice.ts";

interface AppState {
    isLoading: boolean;
    isMetadataLoading: boolean;
    countriesData: Record<OutbreakNames, CountryData[]>;
    metadata: {[key: string]: {name: string, long: number, lat: number, bounds: number[]}};
    totalNumberOfCases: Record<OutbreakNames, number>;
    lastUpdateDate: Record<OutbreakNames, string>;
}

const initialState: AppState = {
    isLoading: false,
    isMetadataLoading: false,
    countriesData: Object.values(OutbreakNames).reduce(
        (acc, name) => ({ ...acc, [name]: [] }),
        {} as Record<OutbreakNames, CountryData[]>,
    ),
    totalNumberOfCases: Object.values(OutbreakNames).reduce(
        (acc, name) => ({ ...acc, [name]: 0 }),
        {} as Record<OutbreakNames, number>,
    ),
    lastUpdateDate: Object.values(OutbreakNames).reduce(
        (acc, name) => ({ ...acc, [name]: '' }),
        {} as Record<OutbreakNames, string>,
    ),
    metadata: {},
};

export const countrySlice = createSlice({
    name: 'country',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(fetchCountriesData.pending, (state) => {
            state.isLoading = true;
        });
        builder.addCase(fetchCountriesData.fulfilled, (state, {payload }) => {
            state.isLoading = false;
            const outbreakKey = OutbreakNames[payload.outbreakName as keyof typeof OutbreakNames];
            state.countriesData[outbreakKey] = payload.countriesData;
            state.totalNumberOfCases[outbreakKey] = payload.totalNumberOfCases;
            state.lastUpdateDate[outbreakKey] = payload.lastUpdateDate;
        });
        builder.addCase(fetchCountriesData.rejected, (state) => {
            state.isLoading = false;
        });
        builder.addCase(fetchCountryMetadata.pending, (state) => {
            state.isMetadataLoading = true;
        });
        builder.addCase(fetchCountryMetadata.fulfilled, (state, {payload }) => {
            state.isMetadataLoading = false;
            state.metadata = payload;
        });
        builder.addCase(fetchCountryMetadata.rejected, (state) => {
            state.isMetadataLoading = false;
        });
    },
});

export default countrySlice.reducer;
