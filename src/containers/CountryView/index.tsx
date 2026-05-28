import { useEffect } from 'react';

import MapContainer from 'src/components/MapContainer';
import { ChartTypeNames } from 'src/models/ViewParamURLValues';
import { selectFocusedArea, selectOutbreakName } from 'src/redux/App/selectors';
import { selectCountriesData } from 'src/redux/Country/selectors';
import { setFocusedArea } from 'src/redux/App/slice';
import { fetchCountriesData } from 'src/redux/Country/thunks';
import { useAppDispatch, useAppSelector } from 'src/redux/hooks';

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

export const CountryView: React.FC = () => {
    const dispatch = useAppDispatch();

    const countryData = useAppSelector(selectCountriesData);
    const focusedArea = useAppSelector(selectFocusedArea);
    const outbreakName = useAppSelector(selectOutbreakName);

    // Fetch country storage
    useEffect(() => {
        dispatch(setFocusedArea(null));
        dispatch(fetchCountriesData());
        return () => {
            dispatch(setFocusedArea(null));
        };
    }, [outbreakName, dispatch]);

    return (
        <MapContainer
            data={countryData[outbreakName as keyof typeof countryData]}
            focusedArea={focusedArea}
            setFocusedArea={setFocusedArea}
            chartType={ChartTypeNames.Country}
            adminLevel={0}
            dataLayerBounds={dataLayerBounds}
        />
    );
};
