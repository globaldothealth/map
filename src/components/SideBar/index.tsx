import {
    Autocomplete,
    Box,
    // MenuItem,
    TextField,
    // Select,
    FormControl,
    Typography,
} from '@mui/material';
import { useState, useEffect, SyntheticEvent } from 'react';
import { whereAlpha3 } from 'iso-3166-1';

import { CountryData } from 'src/models/CountryData';
import { FocusedArea } from 'src/models/FocusedArea';
import { RegionalData } from 'src/models/RegionalData';
import { StateData } from 'src/models/StateData';
import {
    selectCountriesData,
    selectCountryTotalCases,
    selectCountryTotalCasesIsLoading,
} from 'src/redux/Country/selectors';
import {
    selectFocusedArea,
    selectLastUpdateDate,
    // selectOutbreakName,
} from 'src/redux/App/selectors';
import {
    setFocusedArea,
    setPopup,
    // OutbreakNames,
    // setOutbreakName,
} from 'src/redux/App/slice';
import { useAppDispatch, useAppSelector } from 'src/redux/hooks';
import {
    selectRegionalData,
    selectRegionalTotalCases,
} from 'src/redux/Regional/selectors';
import { selectStateData, selectStateTotalCases } from 'src/redux/State/selectors';
import { convertStringDateToDate, getCountryISO2 } from 'src/utils/helperFunctions';

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
    const totalRegionalCasesCount = useAppSelector(selectRegionalTotalCases);
    const totalStateCasesCount = useAppSelector(selectStateTotalCases);
    // const outbreakName = useAppSelector(selectOutbreakName);

    const resolution = location.pathname.split('/')[1] as Resolution;

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
            dispatch(setPopup({ isOpen: false, countryCode: 'worldwide' }));
        } else {
            dispatch(setFocusedArea({ name, areaId, countryCode }));
            dispatch(setPopup({ isOpen: true, countryCode }));
        }
    };

    const handleAutocompleteCountrySelect = (
        _event: SyntheticEvent<Element, Event>,
        value: FocusedArea | null,
    ) => {
        if (value === null) return;

        dispatch(setFocusedArea(value));
        dispatch(setPopup({ isOpen: true, countryCode: value.countryCode }));
    };

    const mapDataToAutocomplete = (
        administrativeAreaData: CountryData[] | StateData[] | RegionalData[],
    ) => {
        const mappedData = administrativeAreaData.map(
            (administrativeAreaEntry) => {
                return {
                    name: administrativeAreaEntry.name || '',
                    areaId: administrativeAreaEntry.areaId,
                    countryCode:
                        whereAlpha3(administrativeAreaEntry.countryCode)
                            ?.alpha2 || '',
                };
            },
        );
        setAutocompleteData(mappedData);
    };

    useEffect(() => {
        switch (resolution) {
            case Resolution.Country:
                mapDataToAutocomplete(countriesData);
                break;
            case Resolution.State:
                mapDataToAutocomplete(stateData);
                break;
            case Resolution.Region:
                mapDataToAutocomplete(regionalData);
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
                    const { caseCount, countryCode, areaId, name } =
                        administrativeAreaEntry;
                    const isActive = focusedArea?.areaId === areaId;
                    const casesPercentage =
                        (caseCount / totalCountryCasesCount) * 100;

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
                            <CaseCountsBar barWidth={casesPercentage} />
                        </LocationListItem>
                    );
                })}{' '}
            </>
        );
    };

    const Countries = () => {
        switch (resolution) {
            case Resolution.Country:
                return renderAdministrativeAreaList(
                    getDataForAdministrativeAreaList(countriesData),
                );
            case Resolution.State:
                return renderAdministrativeAreaList(
                    getDataForAdministrativeAreaList(stateData),
                );
            case Resolution.Region:
                return renderAdministrativeAreaList(
                    getDataForAdministrativeAreaList(regionalData),
                );
            default:
                return null;
        }
    };

    const getTotalCountText = () => {
        switch (resolution) {
            case Resolution.State:
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
            case Resolution.Region:
                return (
                    <>
                        <span id="total-cases" className="active">
                            {totalRegionalCasesCount.toLocaleString()}
                        </span>
                        <span className="reported-cases-label">
                            {' '}
                            confirmed cases available for Regional View
                        </span>
                    </>
                );
            default:
                return (
                    <>
                        <span id="total-cases" className="active">
                            {totalCountryCasesCount.toLocaleString()}
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
                        <Typography variant='h4' sx={{backgroundColor: 'rgb(25, 118, 210)', color: 'white', p:'.5em', borderRadius: '.3em', fontWeight: 'bold'}}>
                            Hantavirus
                        </Typography>
                        {/*<Select*/}
                        {/*    labelId="outbreak-select-label"*/}
                        {/*    id="outbreak-select"*/}
                        {/*    value={outbreakName}*/}
                        {/*    label="Selected Outbreak"*/}
                        {/*    onChange={(event) => {*/}
                        {/*        dispatch(*/}
                        {/*            setOutbreakName(*/}
                        {/*                event.target*/}
                        {/*                    .value as keyof typeof OutbreakNames,*/}
                        {/*            ),*/}
                        {/*        );*/}
                        {/*    }}*/}
                        {/*    sx={{*/}
                        {/*        background: 'rgb(25, 118, 210)',*/}
                        {/*        fontSize: '1.8rem',*/}
                        {/*        color: 'white',*/}
                        {/*        fontWeight: 'bold',*/}
                        {/*        '& .MuiSelect-icon': {*/}
                        {/*            color: 'white',*/}
                        {/*        },*/}
                        {/*        '& .MuiOutlinedInput-notchedOutline': {*/}
                        {/*            border: 'none',*/}
                        {/*        },*/}
                        {/*    }}*/}
                        {/*>*/}
                        {/*    {(*/}
                        {/*        Object.keys(OutbreakNames) as Array<*/}
                        {/*            keyof typeof OutbreakNames*/}
                        {/*        >*/}
                        {/*    ).map((outbreak) => (*/}
                        {/*        <MenuItem key={outbreak} value={outbreak}>*/}
                        {/*            {OutbreakNames[outbreak]}*/}
                        {/*        </MenuItem>*/}
                        {/*    ))}*/}
                        {/*</Select>*/}
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
                            label={`Choose a ${resolution}`}
                            slotProps={{htmlInput: {
                                ...params.slotProps.htmlInput,
                                'data-cy': 'autocomplete-input',
                            }}}
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
                    <Countries />
                )}
            </LocationList>

            <div id="sidebar-tab" onClick={handleOnClick}>
                <span id="sidebar-tab-icon">{openSidebar ? '◀' : '▶'}</span>
            </div>
        </StyledSideBar>
    );
};

export default SideBar;
