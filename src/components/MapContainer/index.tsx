import {useEffect, useMemo, useRef, useState} from 'react';
import {ActionCreatorWithPayload} from '@reduxjs/toolkit';
import {FeatureCollection} from 'geojson';

import Legend from 'src/components/Legend';
import Loader from 'src/components/Loader';

import {useMaplibreMap} from 'src/hooks/useMaplibreMap';

import {CountryData} from 'src/models/CountryData';
import {FocusedArea} from 'src/models/FocusedArea';
import {RegionalData} from 'src/models/RegionalData';
import {StateData} from 'src/models/StateData';

import {MapContainer as StyledMapContainer} from 'src/theme/globalStyles';

// import CopyStateLinkButton from 'src/components/CopyStateLinkButton';
import {ChartTypeNames} from 'src/models/ViewParamURLValues';

import {
    convertStateDataToFeatureSet,
    getDataLayersFromBounds,
} from 'src/utils/helperFunctions';
import {usePathingLayer} from './PathingLayer';
import Timeseries from "src/components/Timeseries";

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
                          adminLevel,
                          dataLayerBounds,
                      }: MapContainerProps) => {
    const [mapLoaded, setMapLoaded] = useState(false);
    const [dateUpTo, setDateUpTo] = useState('2026-05-01');
    const [overlaysOpen, setOverlaysOpen] = useState({
        'ship': true,
        'tenerifeDepartures': true,
        "significantEvents": true
    });
    const statusColors = {'events': '#ff6756', 'departures': '#ff9983'};

    // // Fetch map data from CSV
    // useEffect(() => {
    //     const url = 'https://raw.githubusercontent.com/kraemer-lab/Hondius_hantavirus_h2026/refs/heads/main/data/linelist/2026_hantavirus.csv';
    //     fetch(url)
    //         .then(response => response.text())
    //         .then(csvText => {
    //             const parseCsvLine = (line: string): string[] => {
    //                 const result: string[] = [];
    //                 let current = '';
    //                 let inQuotes = false;
    //                 for (let i = 0; i < line.length; i++) {
    //                     const char = line[i];
    //                     if (char === '"') {
    //                         inQuotes = !inQuotes;
    //                     } else if (char === ',' && !inQuotes) {
    //                         result.push(current.trim());
    //                         current = '';
    //                     } else {
    //                         current += char;
    //                     }
    //                 }
    //                 result.push(current.trim());
    //                 return result;
    //             };
    //
    //             const lines = csvText.split('\n').filter(l => l.trim());
    //             const headers = parseCsvLine(lines[0]);
    //             const data = lines.slice(1).map(line => {
    //                 const values = parseCsvLine(line.replace(/\r$/, ''));
    //                 const entry: { [key: string]: string } = {};
    //
    //                 headers.forEach((header, index) => {
    //                     entry[header] = values[index];
    //                 });
    //                 return entry;
    //             });
    //             setPathData(data);
    //         })
    //         .catch(error => {
    //             console.error('Error fetching map data:', error);
    //         });
    // }, []);

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
            return {type: 'FeatureCollection', features: []};

        return convertStateDataToFeatureSet(data);
    }, [data]);

    // Adds a choropleth layer to the map and sets up the interaction (Popup and fly to country on click)
    usePathingLayer(
        map.current,
        adminLevel,
        data,
        setMapLoaded,
        mapLoaded,
        dataFeatureSet,
        setFocusedArea,
        focusedArea,
        dataLayerBounds,
        overlaysOpen,
        statusColors,
        dateUpTo
    );

    return (
        <>
            {(!mapLoaded || !dataFeatureSet) && <Loader/>}
            <StyledMapContainer
                ref={mapContainer}
                $isLoading={!mapLoaded || !dataFeatureSet}
            />
            <Timeseries isHidden={false} setDateUpTo={setDateUpTo}></Timeseries>
            <Legend
                title="Case Count"
                legendRows={getDataLayersFromBounds(dataLayerBounds)}
                // legendRows={<><p>Oko</p></>}
                overlays={[
                    {
                        color: '#454545',
                        label: 'Ship Route',
                        open: overlaysOpen['ship'],
                        toggle: () => setOverlaysOpen(prev => ({...prev, ship: !prev['ship']}))
                    },
                    {
                        color: statusColors.departures,
                        label: 'Tenerife Departures',
                        open: overlaysOpen['tenerifeDepartures'],
                        toggle: () => setOverlaysOpen(prev => ({
                            ...prev,
                            tenerifeDepartures: !prev['tenerifeDepartures']
                        }))
                    },
                    {
                        color: statusColors.events,
                        label: 'Significant Events',
                        open: overlaysOpen['significantEvents'],
                        toggle: () => setOverlaysOpen(prev => ({
                            ...prev,
                            significantEvents: !prev['significantEvents']
                        }))
                    },
                ]}
            />
            {/*<CopyStateLinkButton map={map} chartType={chartType}/>*/}
        </>
    );
};

export default MapContainer;
