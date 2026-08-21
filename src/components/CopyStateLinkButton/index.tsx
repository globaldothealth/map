import {RefObject, useEffect, useState} from 'react';
import maplibregl from 'maplibre-gl';
import {Done as DoneIcon, Link as LinkIcon} from '@mui/icons-material';
import {Alert, Snackbar} from '@mui/material';
import {useNavigate} from 'react-router-dom';

import {ChartTypeNames} from 'src/models/ViewParamURLValues';
// import {CountryData} from 'src/models/CountryData';
// import {RegionalData} from 'src/models/RegionalData';
// import {StateData} from 'src/models/StateData';
import {selectFocusedArea, selectOutbreakName, selectResolution} from 'src/redux/App/selectors';
// import {setFocusedArea} from 'src/redux/App/slice';
// import {selectCountriesData} from 'src/redux/Country/selectors';
import {useAppSelector} from 'src/redux/hooks';
// import {selectRegionalData} from 'src/redux/Regional/selectors';
// import {selectStateData} from 'src/redux/State/selectors';
import {URLToFilters} from 'src/utils/helperFunctions';

import {CopyStateLinkButtonContainer} from './styled';

interface CopyStateLinkButtonProps {
    map?: RefObject<maplibregl.Map | null>;
    chartType?: ChartTypeNames;
}

const CopyStateLinkButton = ({map, chartType}: CopyStateLinkButtonProps) => {
    // const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const focusedArea = useAppSelector(selectFocusedArea);
    // const countriesData = useAppSelector(selectCountriesData);
    // const stateData = useAppSelector(selectStateData);
    // const regionalData = useAppSelector(selectRegionalData);
    // const popup = useAppSelector(selectPopup);
    const outbreakName = useAppSelector(selectOutbreakName);
    const resolution = useAppSelector(selectResolution);

    // const handleLocationChange = (
    //     areaId: string,
    //     administrativeAreaData: CountryData[] | StateData[] | RegionalData[],
    // ) => {
    //     if (administrativeAreaData?.length > 0) {
    //         const foundAdministrativeArea = administrativeAreaData.find(
    //             (
    //                 administrativeAreaEntry:
    //                     | CountryData
    //                     | StateData
    //                     | RegionalData,
    //             ) => administrativeAreaEntry.areaId === areaId,
    //         );
    //         if (
    //             foundAdministrativeArea &&
    //             foundAdministrativeArea.areaId !== focusedArea?.areaId
    //         ) {
    //             dispatch(
    //                 setFocusedArea({
    //                     name: foundAdministrativeArea.name,
    //                     areaId: foundAdministrativeArea.areaId,
    //                     countryCode: foundAdministrativeArea.countryCode,
    //                 }),
    //             );
    //         }
    //     }
    // };

    useEffect(() => {
        if (map && map.current) {
            const newViewValues = URLToFilters(location.search);
            const remainingQueryParams = new URLSearchParams(location.search);

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

            const newSearch = remainingQueryParams.toString();
            if (newSearch) {
                navigate(`${location.pathname}?${newSearch}`, {replace: true});
            } else {
                navigate(location.pathname, {replace: true});
            }
        }
    }, [location.search, map?.current]);

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


            if (focusedArea?.areaId) {
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
