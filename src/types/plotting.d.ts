export type PlotData = { time: number; value: number };
export type DataMap = Record<string, PlotData[]>;

export interface ChartSeriesOptions {
  smooth?: boolean;
  showSymbol?: boolean;
  lineWidth?: number;
}

export type DataZoomType = 'slider' | 'inside';