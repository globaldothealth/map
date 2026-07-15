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
    EbolaBVD = 'Ebola BVD',
    Marburg = 'Marburg',
    Mpox2022 = 'Mpox 2022',
    Mpox2024 = 'Mpox 2024',
}

export enum Resolutions {
    Admin0 = 'Admin0',
    Admin1 = 'Admin1',
    Admin2 = 'Admin2',
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
    resolution: Resolutions;
    availableResolutionsForOutbreaks: {
        [key in keyof typeof OutbreakNames]: Resolutions[];
    }
}

// This function checks the URL for an 'outbreakName' and sets it, this is done to avoid multiple fetching of outbreak data
const getInitialOutbreakName = (): keyof typeof OutbreakNames => {
    const params = new URLSearchParams(window.location.search);
    const urlValue = params.get('outbreakName') as keyof typeof OutbreakNames | null;
    if (urlValue && urlValue in OutbreakNames) return urlValue;
    return 'EbolaBVD';
};

// This function checks the URL for an 'resolution' and sets it, this is done to avoid multiple fetching of outbreak data
const getInitialResolution = (): Resolutions => {
    const params = new URLSearchParams(window.location.search);
    const urlValue = params.get('resolution') as Resolutions | null;
    if (urlValue && urlValue in Resolutions) return urlValue;
    return Resolutions['Admin0'];
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
    resolution: getInitialResolution(),
    availableResolutionsForOutbreaks: {
        Covid19: [Resolutions.Admin0],
        AvianInfluenza: [Resolutions.Admin0, Resolutions.Admin1],
        Ebola: [Resolutions.Admin0, Resolutions.Admin1],
        EbolaBVD: [Resolutions.Admin0, Resolutions.Admin1, Resolutions.Admin2],
        Marburg: [Resolutions.Admin0, Resolutions.Admin1],
        Mpox2022: [Resolutions.Admin0],
        Mpox2024: [Resolutions.Admin0],
    }
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
        setResolution: (state, action: PayloadAction<Resolutions>) => {
            state.resolution = action.payload;
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
    setResolution,
} = appSlice.actions;

export default appSlice.reducer;
