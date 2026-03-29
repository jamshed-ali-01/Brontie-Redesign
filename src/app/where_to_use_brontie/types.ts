// types/react-simple-maps.d.ts
declare module 'react-simple-maps' {
  import { ReactNode, MouseEvent, SVGProps } from 'react';

  export interface Point {
    x: number;
    y: number;
  }

  export interface ProjectionConfig {
    scale?: number;
    center?: [number, number];
    rotate?: [number, number, number];
  }

  export interface ComposableMapProps {
    width?: number;
    height?: number;
    projection?: string;
    projectionConfig?: ProjectionConfig;
    style?: React.CSSProperties;
    children?: ReactNode;
    className?: string;
  }

  export interface GeographiesChildrenProps {
    geographies: GeographyObject[];
    path: (geo: GeographyObject) => string;
    projection: (coordinates: [number, number]) => Point;
  }

  export interface GeographyObject {
    rsmKey: string;
    properties: Record<string, any>;
    geometry: any;
  }

  export interface GeographiesProps {
    geography: string | object;
    children: (props: GeographiesChildrenProps) => ReactNode;
  }

  export interface GeographyProps {
    geography: GeographyObject;
    style?: {
      default?: React.CSSProperties;
      hover?: React.CSSProperties;
      pressed?: React.CSSProperties;
    };
    onMouseEnter?: (event: MouseEvent<SVGElement>) => void;
    onMouseLeave?: (event: MouseEvent<SVGElement>) => void;
    onClick?: (event: MouseEvent<SVGElement>) => void;
    className?: string;
  }

  export interface MarkerProps {
    coordinates: [number, number];
    children?: ReactNode;
    onMouseEnter?: (event: MouseEvent<SVGElement>) => void;
    onMouseLeave?: (event: MouseEvent<SVGElement>) => void;
    onClick?: (event: MouseEvent<SVGElement>) => void;
    style?: React.CSSProperties;
    className?: string;
  }

  export const ComposableMap: React.FC<ComposableMapProps>;
  export const Geographies: React.FC<GeographiesProps>;
  export const Geography: React.FC<GeographyProps>;
  export const Marker: React.FC<MarkerProps>;
  export const useGeographies: () => any;
}