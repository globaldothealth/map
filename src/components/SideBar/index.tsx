import {
    Autocomplete,
    Box,
    ListSubheader,
    MenuItem,
    TextField,
    Select,
    FormControl,
} from '@mui/material';
import {useState, useEffect, SyntheticEvent} from 'react';
import {whereAlpha3} from 'iso-3166-1';

import {CountryData} from 'src/models/CountryData';
import {FocusedArea} from 'src/models/FocusedArea';
import {RegionalData} from 'src/models/RegionalData';
import {StateData} from 'src/models/StateData';
import {
    selectCountriesData,
    selectCountryTotalCases,
    selectCountryTotalCasesIsLoading,
} from 'src/redux/Country/selectors';
import {
    selectAvailableResolutionsForOutbreaks,
    selectFocusedArea,
    selectLastUpdateDate,
    selectOutbreakName, selectResolution,
} from 'src/redux/App/selectors';
import {
    setFocusedArea,
    setPopup,
    OutbreakNames,
    setOutbreakName, setResolution, Resolutions,
} from 'src/redux/App/slice';
import {useAppDispatch, useAppSelector} from 'src/redux/hooks';
import {
    selectRegionalData,
} from 'src/redux/Regional/selectors';
import {selectStateData, selectStateTotalCases} from 'src/redux/State/selectors';
import {convertStringDateToDate, getCountryISO2} from 'src/utils/helperFunctions';

import {
    CaseCountsBar,
    CountriesListSkeleton,
    CountryCaseCount,
    CountryLabel,
    EmptyFlag,
    FlagIcon,
    LatestGlobal,
    LocationList,
    LocationListItem,
    SearchBar,
    SideBarHeader,
    SideBarTitlesSkeleton,
    StyledSideBar,
} from './styled';

enum Resolution {
    Country = 'country',
    State = 'state',
    Region = 'region',
}

const SideBar = () => {
    const [openSidebar, setOpenSidebar] = useState(true);
    const [autocompleteData, setAutocompleteData] = useState<FocusedArea[]>([]);

    const dispatch = useAppDispatch();

    const countriesData = useAppSelector(selectCountriesData);
    const lastUpdateDate = useAppSelector(selectLastUpdateDate);
    const regionalData = useAppSelector(selectRegionalData);
    const stateData = useAppSelector(selectStateData);
    const focusedArea = useAppSelector(selectFocusedArea);
    const totalCountryCasesCount = useAppSelector(selectCountryTotalCases);
    const totalCountryCasesCountIsLoading = useAppSelector(
        selectCountryTotalCasesIsLoading,
    );
    const totalStateCasesCount = useAppSelector(selectStateTotalCases);
    const outbreakName = useAppSelector(selectOutbreakName);

    const resolution = useAppSelector(selectResolution);
    const availableResolutionsForOutbreaks = useAppSelector(selectAvailableResolutionsForOutbreaks);

    const handleOnClick = () => {
        setOpenSidebar((value) => !value);
    };

    const handleAreaClick = (
        name: string,
        areaId: string,
        countryCode: string,
    ) => {
        if (focusedArea?.areaId === areaId) {
            dispatch(setFocusedArea(null));
            dispatch(setPopup({isOpen: false, countryCode: 'worldwide'}));
        } else {
            dispatch(setFocusedArea({name, areaId, countryCode}));
            dispatch(setPopup({isOpen: true, countryCode}));
        }
    };

    const handleAutocompleteCountrySelect = (
        _event: SyntheticEvent<Element, Event>,
        value: FocusedArea | null,
    ) => {
        if (value === null) return;

        dispatch(setFocusedArea(value));
        dispatch(setPopup({isOpen: true, countryCode: value.countryCode}));
    };

    const mapDataToAutocomplete = (
        administrativeAreaData: CountryData[] | StateData[] | RegionalData[],
    ) => {
        const mappedData = administrativeAreaData.map(
            (administrativeAreaEntry) => {
                return {
                    name: administrativeAreaEntry.name || '',
                    areaId: administrativeAreaEntry.areaId,
                    // Kosovo is not available in the library
                    countryCode:
                        administrativeAreaEntry.countryCode === 'XKX' ? "XK" : whereAlpha3(administrativeAreaEntry.countryCode)
                            ?.alpha2 || '',
                };
            },
        );
        setAutocompleteData(mappedData);
    };

    useEffect(() => {
        switch (resolution) {
            case Resolutions.Admin0:
                mapDataToAutocomplete(countriesData[OutbreakNames[outbreakName]]);
                break;
            case Resolutions.Admin1:
                mapDataToAutocomplete(stateData);
                break;
        }
    }, [countriesData, stateData, regionalData]);

    const getDataForAdministrativeAreaList = (
        administrativeAreaData: CountryData[] | StateData[] | RegionalData[],
    ) => {
        return administrativeAreaData
            .map((administrativeAreaEntry) => {
                return {
                    caseCount: administrativeAreaEntry.caseCount,
                    countryCode: administrativeAreaEntry.countryCode,
                    areaId: administrativeAreaEntry.areaId,
                    name: administrativeAreaEntry.name,
                };
            })
            .sort(
                (administrativeAreaEntry1, administrativeAreaEntry2) =>
                    administrativeAreaEntry2.caseCount -
                    administrativeAreaEntry1.caseCount,
            );
    };

    const renderAdministrativeAreaList = (
        administrativeAreaData: {
            caseCount: number;
            countryCode: string;
            areaId: string;
            name: string;
        }[],
    ) => {
        return (
            <>
                {administrativeAreaData.map((administrativeAreaEntry) => {
                    const {caseCount, countryCode, areaId, name} =
                        administrativeAreaEntry;
                    const isActive = focusedArea?.areaId === areaId;
                    const casesPercentage =
                        (caseCount / totalCountryCasesCount[OutbreakNames[outbreakName]]) * 100;

                    return (
                        <LocationListItem
                            key={areaId}
                            onClick={() =>
                                handleAreaClick(name, areaId, countryCode)
                            }
                            data-cy="listed-country"
                            isActive={isActive}
                        >
                            <>
                                <FlagIcon
                                    loading="lazy"
                                    src={`https://flagcdn.com/w20/${getCountryISO2(
                                        countryCode,
                                    ).toLowerCase()}.png`}
                                    srcSet={`https://flagcdn.com/w40/${getCountryISO2(
                                        countryCode,
                                    ).toLowerCase()}.png 2x`}
                                    alt={`${countryCode} flag`}
                                />
                                <CountryLabel
                                    isActive={isActive}
                                    variant="body2"
                                >
                                    {name}
                                </CountryLabel>
                            </>
                            <CountryCaseCount
                                isActive={isActive}
                                variant="body2"
                            >
                                {caseCount.toLocaleString()}
                            </CountryCaseCount>
                            <CaseCountsBar barWidth={casesPercentage}/>
                        </LocationListItem>
                    );
                })}{' '}
            </>
        );
    };

    const SidebarEntries = () => {
        switch (resolution) {
            case Resolutions.Admin0:
                return renderAdministrativeAreaList(
                    getDataForAdministrativeAreaList(countriesData[OutbreakNames[outbreakName]]),
                );
            case Resolutions.Admin1:
                return renderAdministrativeAreaList(
                    getDataForAdministrativeAreaList(stateData),
                );
            default:
                return null;
        }
    };

    const getTotalCountText = () => {
        switch (resolution) {
            case Resolutions.Admin1:
                return (
                    <>
                        <span id="total-cases" className="active">
                            {totalStateCasesCount.toLocaleString()}
                        </span>
                        <span className="reported-cases-label">
                            {' '}
                            confirmed cases available for State View
                        </span>
                    </>
                );
            default:
                return (
                    <>
                        <span id="total-cases" className="active">
                            {totalCountryCasesCount[OutbreakNames[outbreakName]].toLocaleString()}
                        </span>
                        <span className="reported-cases-label">
                            {' '}
                            confirmed cases
                        </span>
                    </>
                );
        }
    };

    return (
        <StyledSideBar $sidebaropen={openSidebar} data-cy="sidebar">
            <SideBarHeader id="sidebar-header">
                <div id="disease-selector">
                    <FormControl fullWidth>
                        <Select
                            labelId="outbreak-select-label"
                            id="outbreak-select"
                            value={`${outbreakName}|${resolution || Resolution.Country}`}
                            label="Selected Outbreak"
                            onChange={(event) => {
                                const [outbreak, view] = (event.target.value as string).split('|');
                                dispatch(
                                    setOutbreakName(
                                        outbreak as keyof typeof OutbreakNames,
                                    ),
                                );
                                dispatch(
                                    setResolution(view == 'country' ? Resolutions.Admin0 : Resolutions.Admin1),
                                )
                            }}
                            renderValue={() =>
                                (
                                    <p>{OutbreakNames[outbreakName]} <span
                                        style={{fontWeight: '300'}}>({resolution === Resolutions.Admin0 ? 'Countries' : 'States'})</span>
                                    </p>)
                            }
                            sx={{
                                background: 'rgb(25, 118, 210)',
                                fontSize: '1.8rem',
                                color: 'white',
                                fontWeight: 'bold',
                                '& .MuiSelect-icon': {
                                    color: 'white',
                                },
                                '& .MuiOutlinedInput-notchedOutline': {
                                    border: 'none',
                                },
                            }}
                        >
                            {(
                                Object.keys(OutbreakNames) as Array<
                                    keyof typeof OutbreakNames
                                >
                            ).flatMap((outbreak) => {
                                const availableResolutions = availableResolutionsForOutbreaks[outbreak] ?? [];
                                const resolutionToView: Partial<Record<Resolutions, string>> = {
                                    [Resolutions.Admin0]: 'country',
                                    [Resolutions.Admin1]: 'state',
                                };
                                const items = availableResolutions.map((res) => {
                                    const view = resolutionToView[res]!;
                                    return (
                                        <MenuItem key={`${outbreak}|${view}`} value={`${outbreak}|${view}`}
                                                  sx={{pl: 4}}>
                                            {OutbreakNames[outbreak]}<span
                                            style={{fontWeight: '300', marginLeft: '.3em'}}>({view === 'country' ? 'Countries' : 'States'})</span>
                                        </MenuItem>
                                    );
                                });
                                if (items.length === 0) return [];
                                return [
                                    <ListSubheader key={`header-${outbreak}`}>
                                        {OutbreakNames[outbreak]}
                                    </ListSubheader>,
                                    ...items,
                                ];
                            })}
                        </Select>
                    </FormControl>
                </div>
            </SideBarHeader>
            <LatestGlobal id="latest-global" $sidebaropen={openSidebar}>
                {totalCountryCasesCountIsLoading ? (
                    <SideBarTitlesSkeleton
                        animation="pulse"
                        variant="rectangular"
                        data-cy="loading-skeleton"
                    />
                ) : (
                    <>{getTotalCountText()}</>
                )}
                <div className="last-updated-date">
                    Last reported case:{' '}
                    {totalCountryCasesCountIsLoading ? (
                        <SideBarTitlesSkeleton
                            animation="pulse"
                            variant="rectangular"
                            data-cy="loading-skeleton"
                        />
                    ) : (
                        <span id="last-updated-date">
                            {convertStringDateToDate(lastUpdateDate)}
                        </span>
                    )}
                </div>
            </LatestGlobal>

            <SearchBar className="searchbar">
                <Autocomplete
                    id="admin-area-select"
                    options={autocompleteData}
                    autoHighlight
                    popupIcon={<></>}
                    getOptionLabel={(option) => {
                        return typeof option === 'string'
                            ? option
                            : option.name;
                    }}
                    onChange={(event, value: FocusedArea | null) =>
                        handleAutocompleteCountrySelect(event, value)
                    }
                    isOptionEqualToValue={(option, value) =>
                        option.areaId === value.areaId
                    }
                    value={focusedArea}
                    renderOption={(props, option) => (
                        <Box
                            component="li"
                            className="autocompleteBox"
                            {...props}
                        >
                            {option.name === 'worldwide' ||
                            !option.countryCode ? (
                                <EmptyFlag>-</EmptyFlag>
                            ) : (
                                <FlagIcon
                                    loading="lazy"
                                    width="20"
                                    src={`https://flagcdn.com/w20/${option.countryCode.toLowerCase()}.png`}
                                    srcSet={`https://flagcdn.com/w40/${option.countryCode.toLowerCase()}.png 2x`}
                                    alt={`${option.countryCode} flag`}
                                />
                            )}

                            {option.name}
                        </Box>
                    )}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label={`Choose a ${resolution === Resolutions.Admin0 ? 'country' : 'state'}...`}
                        />
                    )}
                />
            </SearchBar>
            <LocationList>
                {totalCountryCasesCountIsLoading ? (
                    <CountriesListSkeleton
                        animation="pulse"
                        variant="rectangular"
                        data-cy="loading-skeleton"
                    />
                ) : (
                    <SidebarEntries/>
                )}
            </LocationList>

            <div id="sidebar-tab" onClick={handleOnClick}>
                <span id="sidebar-tab-icon">{openSidebar ? '◀' : '▶'}</span>
            </div>
        </StyledSideBar>
    );
};

export default SideBar;
