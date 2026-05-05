import type { RootState } from 'src/redux/store';

export const selectIsLoading = (state: RootState) => state.app.isLoading;
export const selectError = (state: RootState) => state.app.error;
export const selectTotalCases = (state: RootState) =>
    state.app.totalNumberOfCases;
export const selectTotalCasesIsLoading = (state: RootState) =>
    state.app.isLoading;
export const selectFocusedArea = (state: RootState) =>
    state.app.focusedArea;
export const selectLastUpdateDate = (state: RootState) =>
    state.app.lastUpdateDate;
export const selectPopup = (state: RootState) => state.app.popup;
export const selectOutbreakName = (state: RootState) => state.app.outbreakName;