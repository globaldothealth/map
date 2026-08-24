import {
    Autocomplete,
    Box,
    MenuItem,
    TextField,
    Menu,
    Button,
} from '@mui/material';
import {useState, useEffect, SyntheticEvent} from 'react';
import {whereAlpha3} from 'iso-3166-1';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';

import {CountryData} from 'src/models/CountryData';
import {FocusedArea} from 'src/models/FocusedArea';
import {RegionalData} from 'src/models/RegionalData';
import {StateData} from 'src/models/StateData';
import {
    selectCountriesData, selectCountryLastUpdateDate, selectCountryMetadata,
    selectCountryTotalCases,
    selectCountryTotalCasesIsLoading,
} from 'src/redux/Country/selectors';
import {
    selectAvailableResolutionsForOutbreaks,
    selectFocusedArea,
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
    selectStateData,
    selectStateLastUpdatedDate, selectStateMetadata,
    selectStateTotalCases,
    selectStateTotalCasesIsLoading
} from 'src/redux/State/selectors';
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
import {selectRegionalData, selectRegionalLastUpdatedDate,
    selectRegionalMetadata, selectRegionalTotalCases, selectRegionalTotalCasesIsLoading} from "src/redux/Regional/selectors.ts";


const SideBar = () => {
    const [openSidebar, setOpenSidebar] = useState(true);
    const [autocompleteData, setAutocompleteData] = useState<FocusedArea[]>([]);
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
    const [submenuAnchorEl, setSubmenuAnchorEl] = useState<null | HTMLElement>(null);
    const [hoveredOutbreak, setHoveredOutbreak] = useState<keyof typeof OutbreakNames | null>(null);

    const dispatch = useAppDispatch();

    const countriesData = useAppSelector(selectCountriesData);
    const countryMetadata = useAppSelector(selectCountryMetadata);
    const lastUpdateCountryDate = useAppSelector(selectCountryLastUpdateDate);
    const lastUpdateStateDate = useAppSelector(selectStateLastUpdatedDate);
    const lastUpdateRegionalDate = useAppSelector(selectRegionalLastUpdatedDate);
    const stateData = useAppSelector(selectStateData);
    const stateMetadata = useAppSelector(selectStateMetadata);
    const regionalData = useAppSelector(selectRegionalData);
    const regionalMetadata = useAppSelector(selectRegionalMetadata);
    const focusedArea = useAppSelector(selectFocusedArea);
    const totalCountryCasesCount = useAppSelector(selectCountryTotalCases);
    const totalCountryCasesCountIsLoading = useAppSelector(
        selectCountryTotalCasesIsLoading,
    );
    const totalStateCasesCount = useAppSelector(selectStateTotalCases);
    const totalStateCasesCountIsLoading = useAppSelector(
        selectStateTotalCasesIsLoading,
    );
    const totalRegionalCasesCount = useAppSelector(selectRegionalTotalCases);
    const totalRegionalCasesCountIsLoading = useAppSelector(
        selectRegionalTotalCasesIsLoading,
    );
    const outbreakName = useAppSelector(selectOutbreakName);

    const resolution = useAppSelector(selectResolution);
    const availableResolutionsForOutbreaks = useAppSelector(selectAvailableResolutionsForOutbreaks);

    const activeMetadata = resolution === Resolutions.Admin0 ? countryMetadata
        : resolution === Resolutions.Admin1 ? stateMetadata
        : regionalMetadata;

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
        const mappedData = (administrativeAreaData as (CountryData | StateData | RegionalData)[]).filter(administrativeAreaEntry => administrativeAreaEntry.caseCount > 0).map(
            (administrativeAreaEntry) => {
                const name = activeMetadata[administrativeAreaEntry.areaId]?.name || '';
                return {
                    name,
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
        if (Object.keys(activeMetadata).length === 0) return;
        switch (resolution) {
            case Resolutions.Admin0:
                mapDataToAutocomplete(countriesData[OutbreakNames[outbreakName]]);
                break;
            case Resolutions.Admin1:
                mapDataToAutocomplete(stateData[OutbreakNames[outbreakName]]);
                break;
            case Resolutions.Admin2:
                mapDataToAutocomplete(regionalData[OutbreakNames[outbreakName]]);
                break;
        }
    }, [countriesData, stateData, regionalData, resolution, outbreakName, countryMetadata, stateMetadata, regionalMetadata]);

    const getDataForAdministrativeAreaList = (
        administrativeAreaData: CountryData[] | StateData[] | RegionalData[],
    ) => {
        return administrativeAreaData
            .map((administrativeAreaEntry) => {
                const name = activeMetadata[administrativeAreaEntry.areaId]?.name || '';
                return {
                    caseCount: administrativeAreaEntry.caseCount,
                    countryCode: administrativeAreaEntry.countryCode,
                    areaId: administrativeAreaEntry.areaId,
                    name,
                };
            })
            .sort(
                (administrativeAreaEntry1, administrativeAreaEntry2) =>
                    administrativeAreaEntry2.caseCount -
                    administrativeAreaEntry1.caseCount,
            ).filter(administrativeAreaEntry => administrativeAreaEntry.caseCount > 0);
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
        if (Object.keys(activeMetadata).length === 0) return null;
        switch (resolution) {
            case Resolutions.Admin0:
                return renderAdministrativeAreaList(
                    getDataForAdministrativeAreaList(countriesData[OutbreakNames[outbreakName]]),
                );
            case Resolutions.Admin1:
                return renderAdministrativeAreaList(
                    getDataForAdministrativeAreaList(stateData[OutbreakNames[outbreakName]]),
                );
            case Resolutions.Admin2:
                return renderAdministrativeAreaList(
                    getDataForAdministrativeAreaList(regionalData[OutbreakNames[outbreakName]]),
                );
            default:
                return null;
        }
    };

    const getTotalCountText = () => {
        switch (resolution) {
            case Resolutions.Admin2:
                return (
                    <>
                        <span id="total-cases" className="active">
                            {totalRegionalCasesCount[OutbreakNames[outbreakName]].toLocaleString()}
                        </span>
                        <span className="reported-cases-label">
                            {' '}
                            confirmed cases available for Health Zone View
                        </span>
                    </>
                );
            case Resolutions.Admin1:
                return (
                    <>
                        <span id="total-cases" className="active">
                            {totalStateCasesCount[OutbreakNames[outbreakName]].toLocaleString()}
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

    const adminLevelText = resolution === Resolutions.Admin0 ? 'country' : resolution === Resolutions.Admin1 ? 'State/Province' : 'Health Zone (DRC only)';
    const dataLoading = resolution === Resolutions.Admin0 ? totalCountryCasesCountIsLoading : resolution === Resolutions.Admin1 ? totalStateCasesCountIsLoading : totalRegionalCasesCountIsLoading;

    return (
        <StyledSideBar $sidebaropen={openSidebar} data-cy="sidebar">
            <SideBarHeader id="sidebar-header">
                <div id="disease-selector">
                    <span style={{fontSize: '.8em'}}>Select Outbreak:</span>
                    <Button
                        onClick={(e) => setMenuAnchorEl(e.currentTarget)}
                        endIcon={menuAnchorEl ? <KeyboardArrowUpIcon/> : <KeyboardArrowDownIcon/>}
                        sx={{
                            background: 'rgb(25, 118, 210)',
                            fontSize: '2rem',
                            color: 'white',
                            fontWeight: 'bold',
                            textTransform: 'none',
                            width: '100%',
                            justifyContent: 'space-between',
                            '&:hover': {background: 'rgb(21, 101, 180)'},
                            p: "1.2rem",
                            marginTop: '10px'
                        }}
                    >
                        <span style={{textAlign: 'left'}}>{OutbreakNames[outbreakName]}<br/><span style={{fontWeight: '300', fontSize: '16px'}}>{adminLevelText}</span></span>
                    </Button>
                    <Menu
                        anchorEl={menuAnchorEl}
                        open={Boolean(menuAnchorEl)}
                        onClose={() => {
                            setMenuAnchorEl(null);
                            setSubmenuAnchorEl(null);
                            setHoveredOutbreak(null);
                        }}
                        slotProps={{
                            paper: {sx: {minWidth: menuAnchorEl?.offsetWidth ?? 'auto'}},
                        }}
                    >
                        {(Object.keys(OutbreakNames) as Array<keyof typeof OutbreakNames>)
                            .filter((outbreak) => (availableResolutionsForOutbreaks[outbreak] ?? []).length > 0)
                            .map((outbreak) => (
                                <MenuItem
                                    key={outbreak}
                                    onMouseEnter={(e) => {
                                        setHoveredOutbreak(outbreak);
                                        setSubmenuAnchorEl(e.currentTarget);
                                    }}
                                    sx={{display: 'flex', justifyContent: 'space-between'}}
                                >
                                    {OutbreakNames[outbreak]} <ArrowRightIcon/>
                                </MenuItem>
                            ))}
                    </Menu>
                    <Menu
                        anchorEl={submenuAnchorEl}
                        open={Boolean(menuAnchorEl) && Boolean(submenuAnchorEl) && Boolean(hoveredOutbreak)}
                        onClose={() => {
                            setSubmenuAnchorEl(null);
                            setHoveredOutbreak(null);
                        }}
                        anchorOrigin={{vertical: 'top', horizontal: 'right'}}
                        transformOrigin={{vertical: 'top', horizontal: 'left'}}
                        disableAutoFocus
                        autoFocus={false}
                        slotProps={{
                            paper: {sx: {pointerEvents: 'auto', marginTop: '-8px'}},
                            root: {sx: {pointerEvents: 'none'}},
                        }}
                    >
                        {hoveredOutbreak && (availableResolutionsForOutbreaks[hoveredOutbreak] ?? []).map((res) => {
                            const label = res === Resolutions.Admin0 ? 'Country level' : res === Resolutions.Admin1 ? 'State/Province level' : "Health Zone level (DRC only)";
                            return (
                                <MenuItem
                                    key={res}
                                    onClick={() => {
                                        dispatch(setOutbreakName(hoveredOutbreak));
                                        dispatch(setResolution(res));
                                        setMenuAnchorEl(null);
                                        setSubmenuAnchorEl(null);
                                        setHoveredOutbreak(null);
                                    }}
                                >
                                    {label}
                                </MenuItem>
                            );
                        })}
                    </Menu>
                </div>
            </SideBarHeader>
            <LatestGlobal id="latest-global" $sidebaropen={openSidebar}>
                {dataLoading? (
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
                    {dataLoading ? (
                        <SideBarTitlesSkeleton
                            animation="pulse"
                            variant="rectangular"
                            data-cy="loading-skeleton"
                        />
                    ) : (
                        <span id="last-updated-date">
                            {convertStringDateToDate(resolution === Resolutions.Admin0 ? lastUpdateCountryDate[OutbreakNames[outbreakName]] : resolution === Resolutions.Admin1 ? lastUpdateStateDate[OutbreakNames[outbreakName]] : lastUpdateRegionalDate[OutbreakNames[outbreakName]]).toLocaleString()}
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
                            label={`Choose a ${resolution === Resolutions.Admin0 ? 'country' : resolution === Resolutions.Admin1 ? 'state' : 'health zone'}...`}
                        />
                    )}
                />
            </SearchBar>
            <LocationList>
                {dataLoading? (
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
