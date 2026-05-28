import {useEffect} from 'react';

import MapContainer from 'src/components/MapContainer';
import {ChartTypeNames} from 'src/models/ViewParamURLValues';
import {selectFocusedArea, selectOutbreakName, selectResolution} from 'src/redux/App/selectors';
import {selectCountriesData} from 'src/redux/Country/selectors';
import {OutbreakNames, Resolutions, setFocusedArea} from 'src/redux/App/slice';
import {fetchCountriesData} from 'src/redux/Country/thunks';
import {useAppDispatch, useAppSelector} from 'src/redux/hooks';
import {fetchStateData} from "src/redux/State/thunks.ts";
import {selectStateData} from "src/redux/State/selectors.ts";

const dataLayerBounds = {
    'Covid19': {
        [Resolutions.Admin0]: {
            level1: {
                lower: {number: 1, text: '1'},
                upper: {number: 10000, text: '10k'},
            },
            level2: {
                lower: {number: 10001, text: '10k'},
                upper: {number: 100000, text: '100k'},
            },
            level3: {
                lower: {number: 100001, text: '100k'},
                upper: {number: 500000, text: '500k'},
            },
            level4: {
                lower: {number: 500001, text: '500K'},
                upper: {number: 2000000, text: '2M'},
            },
            level5: {
                lower: {number: 2000001, text: '2M'},
                upper: {number: 10000000, text: '10M'},
            },
        },
        [Resolutions.Admin1]: {
            level1: {
                lower: {number: 1, text: '1'},
                upper: {number: 10000, text: '10k'},
            },
            level2: {
                lower: {number: 10001, text: '10k'},
                upper: {number: 100000, text: '100k'},
            },
            level3: {
                lower: {number: 100001, text: '100k'},
                upper: {number: 500000, text: '500k'},
            },
            level4: {
                lower: {number: 500001, text: '500K'},
                upper: {number: 2000000, text: '2M'},
            },
            level5: {
                lower: {number: 2000001, text: '2M'},
                upper: {number: 10000000, text: '10M'},
            },
        }
    },
    'AvianInfluenza': {
        [Resolutions.Admin0]: {
            level1: {
                lower: {number: 1, text: '1'},
                upper: {number: 1, text: '1'},
            },
            level2: {
                lower: {number: 2, text: '2'},
                upper: {number: 3, text: '3'},
            },
            level3: {
                lower: {number: 4, text: '4'},
                upper: {number: 5, text: '5'},
            },
            level4: {
                lower: {number: 6, text: '6'},
                upper: {number: 9, text: '9'},
            },
            level5: {
                lower: {number: 10, text: '10'},
                upper: {number: 20, text: '20'},
            },
        },
        [Resolutions.Admin1]: {
            level1: {
                lower: {number: 1, text: '1'},
                upper: {number: 1, text: '1'},
            },
            level2: {
                lower: {number: 2, text: '2'},
                upper: {number: 3, text: '3'},
            },
            level3: {
                lower: {number: 4, text: '4'},
                upper: {number: 5, text: '5'},
            },
            level4: {
                lower: {number: 6, text: '6'},
                upper: {number: 9, text: '9'},
            },
            level5: {
                lower: {number: 10, text: '10'},
                upper: {number: 20, text: '20'},
            },
        }
    },
    "Ebola": {
        [Resolutions.Admin0]: {
            level1: {
                lower: {number: 1, text: '1'},
                upper: {number: 3, text: '3'},
            },
            level2: {
                lower: {number: 4, text: '4'},
                upper: {number: 10, text: '10'},
            },
            level3: {
                lower: {number: 11, text: '11'},
                upper: {number: 20, text: '20'},
            },
            level4: {
                lower: {number: 21, text: '21'},
                upper: {number: 50, text: '50'},
            },
            level5: {
                lower: {number: 51, text: '51'},
                upper: {number: 100, text: '100'},
            },
        },
        [Resolutions.Admin1]: {
            level1: {
                lower: {number: 1, text: '1'},
                upper: {number: 3, text: '3'},
            },
            level2: {
                lower: {number: 4, text: '4'},
                upper: {number: 10, text: '10'},
            },
            level3: {
                lower: {number: 11, text: '11'},
                upper: {number: 20, text: '20'},
            },
            level4: {
                lower: {number: 21, text: '21'},
                upper: {number: 50, text: '50'},
            },
            level5: {
                lower: {number: 51, text: '51'},
                upper: {number: 100, text: '100'},
            },
        }
    },
    "Marburg": {
        [Resolutions.Admin0]: {
            level1: {
                lower: {number: 1, text: '1'},
                upper: {number: 4, text: '4'},
            },
            level2: {
                lower: {number: 5, text: '5'},
                upper: {number: 9, text: '9'},
            },
            level3: {
                lower: {number: 10, text: '10'},
                upper: {number: 14, text: '14'},
            },
            level4: {
                lower: {number: 15, text: '15'},
                upper: {number: 19, text: '19'},
            },
            level5: {
                lower: {number: 20, text: '20'},
                upper: {number: 25, text: '25'},
            },
        },
        [Resolutions.Admin1]: {
            level1: {
                lower: {number: 1, text: '1'},
                upper: {number: 4, text: '4'},
            },
            level2: {
                lower: {number: 5, text: '5'},
                upper: {number: 9, text: '9'},
            },
            level3: {
                lower: {number: 10, text: '10'},
                upper: {number: 14, text: '14'},
            },
            level4: {
                lower: {number: 15, text: '15'},
                upper: {number: 19, text: '19'},
            },
            level5: {
                lower: {number: 20, text: '20'},
                upper: {number: 25, text: '25'},
            },
        }
    },
    "Mpox2022": {
        [Resolutions.Admin0]: {
            level1: {
                lower: {number: 1, text: '1'},
                upper: {number: 10, text: '10'},
            },
            level2: {
                lower: {number: 11, text: '11'},
                upper: {number: 100, text: '100'},
            },
            level3: {
                lower: {number: 101, text: '101'},
                upper: {number: 500, text: '500'},
            },
            level4: {
                lower: {number: 501, text: '501'},
                upper: {number: 2000, text: '2000'},
            },
            level5: {
                lower: {number: 2001, text: '2001'},
                upper: {number: 5000, text: '5000'},
            },
        },
        [Resolutions.Admin1]: {
            level1: {
                lower: {number: 1, text: '1'},
                upper: {number: 10, text: '10'},
            },
            level2: {
                lower: {number: 11, text: '11'},
                upper: {number: 100, text: '100'},
            },
            level3: {
                lower: {number: 101, text: '101'},
                upper: {number: 500, text: '500'},
            },
            level4: {
                lower: {number: 501, text: '501'},
                upper: {number: 2000, text: '2000'},
            },
            level5: {
                lower: {number: 2001, text: '2001'},
                upper: {number: 5000, text: '5000'},
            },
        }
    },
    "Mpox2024":
        {
            [Resolutions.Admin0]: {
                level1: {
                    lower: {number: 1, text: '1'},
                    upper: {number: 10, text: '10'},
                },
                level2: {
                    lower: {number: 11, text: '11'},
                    upper: {number: 100, text: '100'},
                },
                level3: {
                    lower: {number: 101, text: '101'},
                    upper: {number: 500, text: '500'},
                },
                level4: {
                    lower: {number: 501, text: '501'},
                    upper: {number: 2000, text: '2000'},
                },
                level5: {
                    lower: {number: 2001, text: '2001'},
                    upper: {number: 5000, text: '5000'},
                },
            },
            [Resolutions.Admin1]: {
                level1: {
                    lower: {number: 1, text: '1'},
                    upper: {number: 10, text: '10'},
                },
                level2: {
                    lower: {number: 11, text: '11'},
                    upper: {number: 100, text: '100'},
                },
                level3: {
                    lower: {number: 101, text: '101'},
                    upper: {number: 500, text: '500'},
                },
                level4: {
                    lower: {number: 501, text: '501'},
                    upper: {number: 2000, text: '2000'},
                },
                level5: {
                    lower: {number: 2001, text: '2001'},
                    upper: {number: 5000, text: '5000'},
                },
            }
        }
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
            dataLayerBounds={dataLayerBounds[outbreakName][resolution]}
        />
    );
};
