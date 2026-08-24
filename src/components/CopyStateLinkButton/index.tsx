import {RefObject, useEffect, useState} from 'react';
import maplibregl from 'maplibre-gl';
import {Done as DoneIcon, Link as LinkIcon} from '@mui/icons-material';
import {Alert, Snackbar} from '@mui/material';
import {useLocation, useNavigate} from 'react-router-dom';

import {ChartTypeNames} from 'src/models/ViewParamURLValues';
import {CountryData} from 'src/models/CountryData';
import {RegionalData} from 'src/models/RegionalData';
import {StateData} from 'src/models/StateData';
import {selectFocusedArea, selectOutbreakName, selectResolution} from 'src/redux/App/selectors';
import {OutbreakNames, setFocusedArea} from 'src/redux/App/slice';
import {selectCountriesData, selectCountryMetadata} from 'src/redux/Country/selectors';
import {useAppDispatch, useAppSelector} from 'src/redux/hooks';
import {selectRegionalData, selectRegionalMetadata} from 'src/redux/Regional/selectors';
import {selectStateData, selectStateMetadata} from 'src/redux/State/selectors';
import {URLToFilters} from 'src/utils/helperFunctions';

import {CopyStateLinkButtonContainer} from './styled';
import {AdminMetadataEntry} from "src/models/AdminMetadata.ts";

type AreaDataEntry = CountryData | StateData | RegionalData;

interface CopyStateLinkButtonProps {
    map?: RefObject<maplibregl.Map | null>;
    chartType?: ChartTypeNames;
}

const CopyStateLinkButton = ({map, chartType}: CopyStateLinkButtonProps) => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const routerLocation = useLocation();

    const focusedArea = useAppSelector(selectFocusedArea);
    const countriesData = useAppSelector(selectCountriesData);
    const countryMetadata = useAppSelector(selectCountryMetadata);
    const stateData = useAppSelector(selectStateData);
    const stateMetadata = useAppSelector(selectStateMetadata);
    const regionalData = useAppSelector(selectRegionalData);
    const regionalMetadata = useAppSelector(selectRegionalMetadata);
    // const popup = useAppSelector(selectPopup);
    const outbreakName = useAppSelector(selectOutbreakName);
    const resolution = useAppSelector(selectResolution);

    const handleLocationChange = (
        foundDataEntry: AreaDataEntry,
        foundMetadataEntry: AdminMetadataEntry,
    ) => {
        dispatch(
            setFocusedArea({
                name: foundMetadataEntry.name,
                areaId: foundDataEntry.areaId,
                countryCode: foundDataEntry.countryCode,
            }),
        );
    };

    useEffect(() => {
        if (!map?.current) return;

        const newViewValues = URLToFilters(routerLocation.search);
        const remainingQueryParams = new URLSearchParams(routerLocation.search);
        const outbreakKey = OutbreakNames[outbreakName];

        // We set the outbreakName and resolution in the App Slice
        remainingQueryParams.delete('outbreakName');
        remainingQueryParams.delete('resolution');

        const mapRef = map.current;
        if (newViewValues.lng && newViewValues.lat) {
            mapRef.setCenter([
                newViewValues.lng || 40,
                newViewValues.lat || 0,
            ]);
            remainingQueryParams.delete('lng');
            remainingQueryParams.delete('lat');
        }
        if (newViewValues.zoom) {
            mapRef.setZoom(newViewValues.zoom || 2.5);
            remainingQueryParams.delete('zoom');
        }

        const areaId = newViewValues.focusedArea;

        if (areaId) {
            if (newViewValues.chartType === ChartTypeNames.Country) {
                const countryEntries = countriesData[outbreakKey];
                const foundDataEntry = countryEntries?.find((entry) => entry.areaId === areaId);
                const foundMetadataEntry = countryMetadata[areaId];
                if (foundDataEntry && foundMetadataEntry) {
                    handleLocationChange(foundDataEntry, foundMetadataEntry);
                    remainingQueryParams.delete('chartType');
                    remainingQueryParams.delete('focusedArea');
                }
            }
            if (newViewValues.chartType === ChartTypeNames.State) {
                const stateEntries = stateData[outbreakKey];
                const foundDataEntry = stateEntries?.find((entry) => entry.areaId === areaId);
                const foundMetadataEntry = stateMetadata[areaId];
                if (foundDataEntry && foundMetadataEntry) {
                    handleLocationChange(foundDataEntry, foundMetadataEntry);
                    remainingQueryParams.delete('chartType');
                    remainingQueryParams.delete('focusedArea');
                }
            }
            if (newViewValues.chartType === ChartTypeNames.Regional) {
                const regionalEntries = regionalData[outbreakKey];
                const foundDataEntry = regionalEntries?.find((entry) => entry.areaId === areaId);
                const foundMetadataEntry = regionalMetadata[areaId];
                if (foundDataEntry && foundMetadataEntry) {
                    handleLocationChange(foundDataEntry, foundMetadataEntry);
                    remainingQueryParams.delete('chartType');
                    remainingQueryParams.delete('focusedArea');
                }
            }
        }

        const newSearch = remainingQueryParams.toString();
        if (newSearch) {
            navigate(`${routerLocation.pathname}?${newSearch}`, {replace: true});
        } else {
            navigate(routerLocation.pathname, {replace: true});
        }
    }, [routerLocation.search, routerLocation.pathname, map?.current, outbreakName, countriesData, stateData, regionalData, countryMetadata, stateMetadata, regionalMetadata, navigate]);

    const [copyHandler, setCopyHandler] = useState({
        message: `Copy link to view`,
        isCopying: false,
    });

    const [snackbarAlertOpen, setSnackbarAlertOpen] = useState(false);

    useEffect(() => {
        if (!snackbarAlertOpen) return;
        setTimeout(() => {
            setSnackbarAlertOpen(false);
        }, 3000);
    }, [snackbarAlertOpen]);

    const handleCopyLinkButton = () => {
        const mapRef = map?.current;

        if (copyHandler.isCopying) return;

        if (!mapRef) return;
        else {
            const center = mapRef.getCenter().toArray();
            const zoom = mapRef.getZoom();
            const mapDataQuery = `resolution=${resolution}&outbreakName=${outbreakName}&lng=${center[0]}&lat=${center[1]}&zoom=${zoom}`;
            const locationHref = window.location.href.split('?')[0];

            if (focusedArea?.areaId && chartType) {
                navigator.clipboard.writeText(
                    `${locationHref}?${
                        mapDataQuery +
                        '&chartType=' +
                        chartType +
                        '&focusedArea=' +
                        focusedArea.areaId
                    }`,
                );
            } else {
                navigator.clipboard.writeText(
                    `${locationHref}?${mapDataQuery}`,
                );
            }
        }
        setCopyHandler({message: 'Copied!', isCopying: true});

        setTimeout(() => {
            setCopyHandler({
                message: ` Copy link to view`,
                isCopying: false,
            });
        }, 2000);
    };

    return (
        <>
            <CopyStateLinkButtonContainer
                color="primary"
                variant="extended"
                className="copyLinkButton"
                onClick={handleCopyLinkButton}
            >
                {copyHandler.isCopying ? <DoneIcon/> : <LinkIcon/>}
                <p> {copyHandler.message}</p>
            </CopyStateLinkButtonContainer>
            <Snackbar
                open={snackbarAlertOpen}
                onClose={() => setSnackbarAlertOpen(false)}
                anchorOrigin={{horizontal: 'center', vertical: 'top'}}
                sx={{height: '100%'}}
            >
                <Alert severity="error" variant="filled">
                    Unfortunately, there is no data from the country that you
                    have selected.
                </Alert>
            </Snackbar>
        </>
    );
};

export default CopyStateLinkButton;
