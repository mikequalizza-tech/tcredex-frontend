declare module 'react-map-gl' {
  import { ComponentType, ReactNode } from 'react';

  export interface ViewState {
    longitude: number;
    latitude: number;
    zoom: number;
    pitch?: number;
    bearing?: number;
  }

  export interface MapProps {
    mapboxAccessToken?: string;
    initialViewState?: ViewState;
    style?: React.CSSProperties;
    mapStyle?: string;
    children?: ReactNode;
    onMove?: (evt: { viewState: ViewState }) => void;
    [key: string]: any;
  }

  export interface MarkerProps {
    longitude: number;
    latitude: number;
    anchor?: 'center' | 'top' | 'bottom' | 'left' | 'right';
    children?: ReactNode;
    [key: string]: any;
  }

  export interface NavigationControlProps {
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    [key: string]: any;
  }

  export const Marker: ComponentType<MarkerProps>;
  export const NavigationControl: ComponentType<NavigationControlProps>;
  
  const Map: ComponentType<MapProps>;
  export default Map;
}

declare module 'mapbox-gl/dist/mapbox-gl.css';