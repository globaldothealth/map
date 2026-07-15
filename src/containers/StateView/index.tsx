import { useEffect } from 'react';

import MapContainer from 'src/components/MapContainer';
import { ChartTypeNames } from 'src/models/ViewParamURLValues';
import { selectFocusedArea, selectOutbreakName } from 'src/redux/App/selectors';
import { setFocusedArea } from 'src/redux/App/slice';
import { useAppDispatch, useAppSelector } from 'src/redux/hooks';
import { selectStateData } from 'src/redux/State/selectors';
import { fetchStateData } from 'src/redux/State/thunks';

const dataLayerBounds = {
    level1: {
        lower: { number: 1, text: '1' },
        upper: { number: 4, text: '4' },
    },
    level2: {
        lower: { number: 5, text: '5' },
        upper: { number: 9, text: '9' },
    },
    level3: {
        lower: { number: 10, text: '10' },
        upper: { number: 14, text: '14' },
    },
    level4: {
        lower: { number: 15, text: '15' },
        upper: { number: 19, text: '19' },
    },
    level5: {
        lower: { number: 20, text: '20' },
        upper: { number: 25, text: '25' },
    },
};

export const StateView: React.FC = () => {
    const dispatch = useAppDispatch();

    const stateData = useAppSelector(selectStateData);
    const focusedArea = useAppSelector(selectFocusedArea);
    const outbreakName = useAppSelector(selectOutbreakName);

    // Fetch state storage
    useEffect(() => {
        dispatch(setFocusedArea(null));
        dispatch(fetchStateData());
        return () => {
            dispatch(setFocusedArea(null));
        };
    }, [outbreakName]);

    return (
        <MapContainer
            data={stateData[outbreakName as keyof typeof stateData]}
            focusedArea={focusedArea}
            setFocusedArea={setFocusedArea}
            chartType={ChartTypeNames.State}
            adminLevel={1}
            dataLayerBounds={dataLayerBounds}
            outbreakName={outbreakName}
        />
    );
};
