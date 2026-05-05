import { RootState } from 'src/redux/store';

export const selectIsStateViewLoading = (state: RootState) =>
    state.state.isLoading;
export const selectStateData = (state: RootState) => state.state.stateData;
export const selectStateTotalCases = (state: RootState) =>
    state.state.totalNumberOfCases;
export const selectStateLastUpdatedDate = (state: RootState) =>
    state.state.lastUpdateDate;