import { RefObject, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { Done as DoneIcon, Link as LinkIcon } from '@mui/icons-material';
import { Alert, Snackbar } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { ChartTypeNames } from 'src/models/ViewParamURLValues';
import { CountryData } from 'src/models/CountryData';
import { RegionalData } from 'src/models/RegionalData';
import { StateData } from 'src/models/StateData';
import { selectFocusedArea, selectPopup } from 'src/redux/App/selectors';
import { setFocusedArea } from 'src/redux/App/slice';
import { selectCountriesData } from 'src/redux/Country/selectors';
import { useAppDispatch, useAppSelector } from 'src/redux/hooks';
import { selectRegionalData } from 'src/redux/Regional/selectors';
import { selectStateData } from 'src/redux/State/selectors';
import { URLToFilters } from 'src/utils/helperFunctions';

import { CopyStateLinkButtonContainer } from './styled';

interface CopyStateLinkButtonProps {
    map?: RefObject<maplibregl.Map | null>;
    chartType?: ChartTypeNames;
}

const CopyStateLinkButton = ({ map, chartType }: CopyStateLinkButtonProps) => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const focusedArea = useAppSelector(selectFocusedArea);
    const countriesData = useAppSelector(selectCountriesData);
    const stateData = useAppSelector(selectStateData);
    const regionalData = useAppSelector(selectRegionalData);
    const popup = useAppSelector(selectPopup);

    useEffect(() => {
        const newViewValues = URLToFilters(location.search);
        if (newViewValues.lng || newViewValues.lat || newViewValues.zoom) {
            if (map && map.current) {
                const mapRef = map.current;
                mapRef.setCenter([
                    newViewValues.lng || 40,
                    newViewValues.lat || 0,
                ]);
                mapRef.setZoom(newViewValues.zoom || 2.5);
            }
        }
        if (map && map.current && !newViewValues.focusedArea) {
            navigate(location.pathname);
        } else if (
            newViewValues.focusedArea === String(focusedArea?.areaId) &&
            popup?.isOpen
        ) {
            navigate(location.pathname);
        }
    }, [location.search, map?.current, focusedArea, popup]);

    const handleLocationChange = (
        areaId: string,
        administrativeAreaData: CountryData[] | StateData[] | RegionalData[],
    ) => {
        if (administrativeAreaData?.length > 0) {
            const foundAdministrativeArea = countriesData.find(
                (
                    administrativeAreaEntry:
                        | CountryData
                        | StateData
                        | RegionalData,
                ) => administrativeAreaEntry.areaId === areaId,
            );
            if (
                foundAdministrativeArea &&
                foundAdministrativeArea.areaId !== focusedArea?.areaId
            ) {
                dispatch(
                    setFocusedArea({
                        name: foundAdministrativeArea.name,
                        areaId: foundAdministrativeArea.areaId,
                        countryCode: foundAdministrativeArea.countryCode,
                    }),
                );
            }
        }
    };

    useEffect(() => {
        const newViewValues = URLToFilters(location.search);
        if (!newViewValues.chartType || !newViewValues.focusedArea) return;
        const focusedAreaareaId = newViewValues.focusedArea;
        switch (newViewValues.chartType) {
            case ChartTypeNames.Country:
                handleLocationChange(focusedAreaareaId, countriesData);
                break;
            case ChartTypeNames.State:
                handleLocationChange(focusedAreaareaId, stateData);
                break;
            case ChartTypeNames.Regional:
                handleLocationChange(focusedAreaareaId, regionalData);
                break;
        }
    }, [location.search, countriesData, stateData, regionalData]);

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
            const mapDataQuery = `lng=${center[0]}&lat=${center[1]}&zoom=${zoom}`;

            if (focusedArea?.areaId) {
                navigator.clipboard.writeText(
                    `${window.location.href}?${
                        mapDataQuery +
                        '&chartType=' +
                        chartType +
                        '&focusedArea=' +
                        focusedArea.areaId
                    }`,
                );
            } else {
                navigator.clipboard.writeText(
                    `${window.location.href}?${mapDataQuery}`,
                );
            }
        }
        setCopyHandler({ message: 'Copied!', isCopying: true });

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
                {copyHandler.isCopying ? <DoneIcon /> : <LinkIcon />}
                <p> {copyHandler.message}</p>
            </CopyStateLinkButtonContainer>
            <Snackbar
                open={snackbarAlertOpen}
                onClose={() => setSnackbarAlertOpen(false)}
                anchorOrigin={{ horizontal: 'center', vertical: 'top' }}
                sx={{ height: '100%' }}
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
