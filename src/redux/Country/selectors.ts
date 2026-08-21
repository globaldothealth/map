import type { RootState } from 'src/redux/store';

export const selectIsCountryViewLoading = (state: RootState) => state.country.isLoading;
export const selectCountriesData = (state: RootState) =>
    state.country.countriesData;
export const selectCountryMetadata = (state: RootState) =>
    state.country.metadata;
export const selectCountryTotalCases = (state: RootState) =>
    state.country.totalNumberOfCases;
export const selectCountryTotalCasesIsLoading = (state: RootState) =>
    state.country.isLoading;
export const selectCountryLastUpdateDate = (state: RootState) =>
    state.country.lastUpdateDate;
