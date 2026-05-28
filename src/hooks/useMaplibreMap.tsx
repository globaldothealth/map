import React, { useEffect, useRef } from 'react';
import maplibregl, { Map } from 'maplibre-gl';
import { ChoroplethMapColors } from 'src/models/Colors';

// Custom hook that configures MapLibre map and displays it in the provided mapContainer ref
export function useMaplibreMap(
    mapContainer: React.RefObject<HTMLDivElement>,
): React.RefObject<Map | null> {
    const map = useRef<Map | null>(null);

    useEffect(() => {
        if (map.current) return;

        map.current = new maplibregl.Map({
            container: mapContainer.current || '',
            style:
                import.meta.env.VITE_MAP_THEME_URL ||
                'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
            renderWorldCopies: false,
            center: [0, 40],
            zoom: 2.5,
            minZoom: 2,
        }).addControl(new maplibregl.NavigationControl(), 'bottom-right');

        map.current.dragRotate.disable();

        map.current.on('load', () => {
            if (!map.current) return;

            map.current.setPaintProperty(
                'water',
                'fill-color',
                ChoroplethMapColors['water'],
            );
            map.current.setPaintProperty(
                'landcover',
                'fill-color',
                ChoroplethMapColors['land'],
            );
            map.current.setPaintProperty(
                'background',
                'background-color',
                ChoroplethMapColors['land'],
            );
            const bordersToRestyle = [
                { id: 'boundary_country_inner', width: 0.2 },
                { id: 'boundary_country_outline', width: 0.2 },
                { id: 'boundary_state', width: 0.4 },
                { id: 'boundary_county', width: 1 },
            ];
            bordersToRestyle.forEach((borderToRestyle) => {
                map.current?.setPaintProperty(
                    borderToRestyle.id,
                    'line-color',
                    ChoroplethMapColors['borders'],
                );
                map.current?.setPaintProperty(
                    borderToRestyle.id,
                    'line-width',
                    borderToRestyle.width,
                );
            });

            // Add outline around water bodies (oceans, lakes, seas = coastlines)
            const waterLayer = map.current
                .getStyle()
                .layers?.find((l) => l.id === 'water') as any;
            if (waterLayer) {
                map.current.addLayer(
                    {
                        id: 'water_outline',
                        type: 'line',
                        source: waterLayer.source,
                        'source-layer': waterLayer['source-layer'],
                        paint: {
                            'line-color': ChoroplethMapColors['borders'],
                            'line-width': 1,
                        },
                    },
                    'water',
                );
            }
        });
    }, []);

    return map;
}
