import { useEffect } from 'react';

import MapContainer from 'src/components/MapContainer';
import { ChartTypeNames } from 'src/models/ViewParamURLValues';
import { selectFocusedArea, selectOutbreakName } from 'src/redux/App/selectors';
import {selectCountriesData, selectDataType} from 'src/redux/Country/selectors';
import { setFocusedArea } from 'src/redux/App/slice';
import { fetchCountriesData } from 'src/redux/Country/thunks';
import { useAppDispatch, useAppSelector } from 'src/redux/hooks';

const dataLayerBounds = {
    level1: {
        lower: { number: 1, text: '1' },
        upper: { number: 1, text: '1' },
    },
    level2: {
        lower: { number: 2, text: '2' },
        upper: { number: 2, text: '2' },
    },
    level3: {
        lower: { number: 3, text: '3' },
        upper: { number: 5, text: '5' },
    },
    level4: {
        lower: { number: 6, text: '6' },
        upper: { number: 10, text: '10' },
    },
    level5: {
        lower: { number: 11, text: '11' },
        upper: { number: 15, text: '25' },
    },
}

export const CountryView: React.FC = () => {
    const dispatch = useAppDispatch();

    const countryData = useAppSelector(selectCountriesData);
    const focusedArea = useAppSelector(selectFocusedArea);
    const outbreakName = useAppSelector(selectOutbreakName);
    const dataType = useAppSelector(selectDataType);

    // Fetch country storage
    useEffect(() => {
        dispatch(setFocusedArea(null));
        dispatch(fetchCountriesData());
        return () => {
            dispatch(setFocusedArea(null));
        };
    }, [outbreakName]);

    return (
        <MapContainer
            data={countryData}
            focusedArea={focusedArea}
            setFocusedArea={setFocusedArea}
            chartType={ChartTypeNames.Country}
            adminLevel={0}
            dataLayerBounds={dataLayerBounds}
            dataType={dataType}
        />
    );
};
