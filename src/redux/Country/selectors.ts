import type { RootState } from 'src/redux/store';

export const selectIsCountryViewLoading = (state: RootState) => state.country.isLoading;
export const selectCountriesData = (state: RootState) =>
    state.country.countriesData;
export const selectConfirmedCaseCount = (state: RootState) =>
    state.country.confirmedCaseCount;
export const selectProbableCaseCount = (state: RootState) =>
    state.country.probableCaseCount;
export const selectCountryTotalCasesIsLoading = (state: RootState) =>
    state.country.isLoading;
export const selectCountryLastUpdateDate = (state: RootState) =>
    state.country.lastUpdateDate;
export const selectDataType = (state: RootState) => state.country.dataType;
