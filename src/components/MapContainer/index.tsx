import { useEffect, useMemo, useRef, useState } from 'react';
import { ActionCreatorWithPayload } from '@reduxjs/toolkit';
import { FeatureCollection } from 'geojson';

import Legend from 'src/components/Legend';
import Loader from 'src/components/Loader';

import { useMaplibreMap } from 'src/hooks/useMaplibreMap';

import { CountryData } from 'src/models/CountryData';
import { FocusedArea } from 'src/models/FocusedArea';
import { RegionalData } from 'src/models/RegionalData';
import { StateData } from 'src/models/StateData';

import { MapContainer as StyledMapContainer } from 'src/theme/globalStyles';

import CopyStateLinkButton from 'src/components/CopyStateLinkButton';
import { ChartTypeNames } from 'src/models/ViewParamURLValues';

import {
    convertStateDataToFeatureSet,
    getDataLayersFromBounds,
} from 'src/utils/helperFunctions';
import { useChoroplethLayer } from './ChoroplethLayer';

interface MapContainerProps {
    data: CountryData[] | StateData[] | RegionalData[];
    focusedArea: FocusedArea | null;
    setFocusedArea: ActionCreatorWithPayload<FocusedArea | null>;
    chartType: ChartTypeNames;
    adminLevel: number;
    dataLayerBounds: {
        [key: string]: {
            lower: { number: number; text: string };
            upper: { number: number; text: string };
        };
    };
}

const MapContainer = ({
    data,
    focusedArea,
    setFocusedArea,
    chartType,
    adminLevel,
    dataLayerBounds,
}: MapContainerProps) => {
    const [mapLoaded, setMapLoaded] = useState(false);

    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useMaplibreMap(mapContainer);

    // Setup map
    useEffect(() => {
        const mapRef = map.current;
        if (!mapRef) return;

        mapRef.on('load', () => {
            setMapLoaded(true);
        });
    }, []);

    const dataFeatureSet: FeatureCollection = useMemo(() => {
        if (!data || data.length === 0)
            return { type: 'FeatureCollection', features: [] };

        return convertStateDataToFeatureSet(data);
    }, [data]);

    // Adds a choropleth layer to the map and sets up the interaction (Popup and fly to country on click)
    useChoroplethLayer(
        map.current,
        adminLevel,
        data,
        setMapLoaded,
        mapLoaded,
        dataFeatureSet,
        setFocusedArea,
        focusedArea,
        dataLayerBounds,
    );

    return (
        <>
            {(!mapLoaded || !dataFeatureSet) && <Loader />}
            <StyledMapContainer
                ref={mapContainer}
                $isLoading={!mapLoaded || !dataFeatureSet}
            />
            <Legend
                title="Confirmed cases"
                legendRows={getDataLayersFromBounds(dataLayerBounds)}
            />
            <CopyStateLinkButton map={map} chartType={chartType} />
        </>
    );
};

export default MapContainer;
