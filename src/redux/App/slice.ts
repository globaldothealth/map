import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {fetchAppData} from 'src/redux/App/thunks';
import {FocusedArea} from 'src/models/FocusedArea';

interface IPopup {
    isOpen: boolean;
    countryCode: string;
}

export enum OutbreakNames {
    Covid19 = 'COVID-19',
    AvianInfluenza = 'Avian Influenza',
    Ebola = 'Ebola',
    Marburg = 'Marburg',
    Mpox2022 = 'Mpox 2022',
    Mpox2024 = 'Mpox 2024',
}

interface AppState {
    isLoading: boolean;
    isMapLoading: boolean;
    error: string | undefined;
    totalNumberOfCases: number;
    focusedArea: FocusedArea | null;
    lastUpdateDate: string;
    popup: IPopup;
    outbreakName: keyof typeof OutbreakNames;
}

// This function checks the URL for an 'outbreakName' and sets it, this is done to avoid multiple fetching of outbreak data
const getInitialOutbreakName = (): keyof typeof OutbreakNames => {
    const params = new URLSearchParams(window.location.search);
    const urlValue = params.get('outbreakName') as keyof typeof OutbreakNames | null;
    if (urlValue && urlValue in OutbreakNames) return urlValue;
    return 'AvianInfluenza';
};

const initialState: AppState = {
    isLoading: false,
    isMapLoading: false,
    error: undefined,
    totalNumberOfCases: 0,
    focusedArea: null,
    lastUpdateDate: '',
    popup: {
        isOpen: false,
        countryCode: '',
    },
    outbreakName: getInitialOutbreakName(),
};

export const appSlice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        setIsMapLoading: (state, action: PayloadAction<boolean>) => {
            state.isMapLoading = action.payload;
        },
        setFocusedArea: (state, action: PayloadAction<FocusedArea | null>) => {
            state.focusedArea = action.payload;
        },
        setLastUpdateDate: (state, action: PayloadAction<string>) => {
            state.lastUpdateDate = action.payload;
        },
        setPopup: (state, action: PayloadAction<IPopup>) => {
            state.popup = action.payload;
        },
        setOutbreakName: (state, action: PayloadAction<keyof typeof OutbreakNames>) => {
            state.outbreakName = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(fetchAppData.pending, (state) => {
            state.isLoading = true;
            state.error = undefined;
        });
        builder.addCase(fetchAppData.fulfilled, (state, { payload }) => {
            state.isLoading = false;
            state.totalNumberOfCases = payload.totalNumberOfCases;
            state.lastUpdateDate = payload.lastUpdateDate;
        });
        builder.addCase(fetchAppData.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload
                ? action.payload
                : action.error.message;
        });
    },
});

export const {
    setFocusedArea,
    setPopup,
    setOutbreakName,
} = appSlice.actions;

export default appSlice.reducer;
