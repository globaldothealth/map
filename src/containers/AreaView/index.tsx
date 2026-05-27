import { useEffect } from 'react';

import MapContainer from 'src/components/MapContainer';
import { ChartTypeNames } from 'src/models/ViewParamURLValues';
import {selectFocusedArea, selectOutbreakName, selectResolution} from 'src/redux/App/selectors';
import { selectCountriesData } from 'src/redux/Country/selectors';
import {OutbreakNames, Resolutions, setFocusedArea} from 'src/redux/App/slice';
import { fetchCountriesData } from 'src/redux/Country/thunks';
import { useAppDispatch, useAppSelector } from 'src/redux/hooks';
import {fetchStateData} from "src/redux/State/thunks.ts";
import {selectStateData} from "src/redux/State/selectors.ts";

const dataLayerBounds = {
    level1: {
        lower: { number: 1, text: '1' },
        upper: { number: 10, text: '10' },
    },
    level2: {
        lower: { number: 11, text: '11' },
        upper: { number: 100, text: '100' },
    },
    level3: {
        lower: { number: 101, text: '101' },
        upper: { number: 500, text: '500' },
    },
    level4: {
        lower: { number: 501, text: '501' },
        upper: { number: 2000, text: '2k' },
    },
    level5: {
        lower: { number: 2001, text: '2001' },
        upper: { number: 10000, text: '10k' },
    },
}

export const AreaView: React.FC = () => {
    const dispatch = useAppDispatch();

    const countryData = useAppSelector(selectCountriesData);
    const stateData = useAppSelector(selectStateData);
    const resolution = useAppSelector(selectResolution);
    const focusedArea = useAppSelector(selectFocusedArea);
    const outbreakName = useAppSelector(selectOutbreakName);

    // Fetch country storage
    useEffect(() => {
        switch (resolution) {
            case Resolutions.Admin0:
                if (!countryData[OutbreakNames[outbreakName as keyof typeof OutbreakNames]].length) {
                    dispatch(fetchCountriesData());
                }
                break;
            default:
                if (!stateData[OutbreakNames[outbreakName as keyof typeof OutbreakNames]].length) {
                    dispatch(fetchStateData());
                }
                break;
        }
        dispatch(setFocusedArea(null));
        return () => {
            dispatch(setFocusedArea(null));
        };
    }, [outbreakName, dispatch, resolution]);

    const adminLevel = resolution === Resolutions.Admin0 ? 0 : 1;
    const chartType = resolution === Resolutions.Admin0 ? ChartTypeNames.Country : ChartTypeNames.State;
    const data = resolution === Resolutions.Admin0
        ? countryData[OutbreakNames[outbreakName]]
        : stateData[OutbreakNames[outbreakName]];

    return (
        <MapContainer
            data={data}
            focusedArea={focusedArea}
            setFocusedArea={setFocusedArea}
            chartType={chartType}
            adminLevel={adminLevel}
            dataLayerBounds={dataLayerBounds}
        />
    );
};
