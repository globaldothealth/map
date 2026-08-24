import { useEffect, useRef, useState } from 'react';
import { ActionCreatorWithPayload } from '@reduxjs/toolkit';

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
import { OutbreakNames } from 'src/redux/App/slice';

import {getDataLayersFromBounds,} from 'src/utils/helperFunctions';
import { useChoroplethLayer } from './ChoroplethLayer';
import {AdminMetadata} from "src/models/AdminMetadata.ts";

interface MapContainerProps {
    data: CountryData[] | StateData[] | RegionalData[];
    metadata: AdminMetadata;
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
    outbreakName: keyof typeof OutbreakNames;
}

const MapContainer = ({
    data,
    metadata,
    focusedArea,
    setFocusedArea,
    chartType,
    adminLevel,
    dataLayerBounds,
    outbreakName,
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

     // Adds a choropleth layer to the map and sets up the interaction (Popup and fly to country on click)
     useChoroplethLayer(
         map.current,
         adminLevel,
         data,
         metadata,
         setMapLoaded,
         mapLoaded,
         setFocusedArea,
         focusedArea,
         dataLayerBounds,
         outbreakName,
     );

     return (
         <>
             {!mapLoaded && <Loader />}
             <StyledMapContainer
                 ref={mapContainer}
                 $isLoading={!mapLoaded}
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
