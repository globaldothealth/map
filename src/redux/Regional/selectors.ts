import { RootState } from 'src/redux/store';

export const selectIsRegionalViewLoading = (state: RootState) =>
    state.regional.isLoading;
export const selectRegionalData = (state: RootState) =>
    state.regional.regionalData;
export const selectRegionalTotalCases = (state: RootState) =>
    state.regional.totalNumberOfCases;
export const selectRegionalTotalCasesIsLoading = (state: RootState) =>
    state.regional.isLoading;
export const selectRegionalLastUpdatedDate = (state: RootState) =>
    state.regional.lastUpdateDate;