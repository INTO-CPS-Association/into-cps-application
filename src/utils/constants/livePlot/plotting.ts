import { LIGHTCOLORS, DARKCOLORS } from "../style/colorsConstants";
import { styleConstants } from "../style/styleConstants";

/**
 * Live Plotting Constants
 * Routes, limits, WebSocket config, and chart styles
 */

// -------------------- Routes --------------------
export const GRAPH_WINDOW_ROUTE = "#/live-plotting" as const;

// -------------------- Dev URLs --------------------
export const DEV_SERVER_URL = "http://localhost:3000" as const;

// -------------------- Retry Intervals --------------------
export const DARK_MODE_RETRY_INTERVALS = [100, 200, 300] as const;

// -------------------- General Limits --------------------
export const MAX_POINTS = 100000;
export const ZOOM_RANGE = 100;
export const AUTO_ZOOM_END = 100 as const;
export const MAX_SLIDER_PERCENT = 100 as const;

// -------------------- WebSocket --------------------
export const WEBSOCKET = {
    URL: "ws://localhost:8085",
    RETRY_DELAY: 1000,
    MAX_RETRIES: 10,
} as const;

// -------------------- Chart Labels --------------------
export const ChartLabels = {
    RealTime: "Real Time",
    SimulatedTime: "Simulated Time",
    Value: "Value",
} as const;

// -------------------- Chart Dimensions --------------------
export const ChartDimensions = {
    XAxis: { rotate: 45, nameGap: 10 },
    DataZoom: { bottom: 20, height: 20 },
};

// -------------------- Data Zoom Types --------------------
export const DataZoomTypes = {
    Slider: 'slider' as const,
    Inside: 'inside' as const
};

// -------------------- Chart Series Defaults --------------------
export const ChartSeriesDefaults = {
    smooth: true,
    showSymbol: false
};

// -------------------- Chart Styles --------------------
export const ChartStyles = {
    Dark: {
        Background: DARKCOLORS.BACKGROUND.PAPER,
        Text: DARKCOLORS.TEXT,
        TooltipBg: DARKCOLORS.TOOLTIP_BG,
        TooltipText: DARKCOLORS.TOOLTIP_TEXT,
        Axis: DARKCOLORS.AXIS,
    },
    Light: {
        Background: LIGHTCOLORS.BACKGROUND.PAPER,
        Text: LIGHTCOLORS.TEXT,
        TooltipBg: LIGHTCOLORS.TOOLTIP_BG,
        TooltipText: LIGHTCOLORS.TOOLTIP_TEXT,
        Axis: LIGHTCOLORS.AXIS,
    },
    Grid: {
        top: 30,
        bottom: 50,
        left: 50,
        right: 115,
        containLabel: true,
    },
    LineWidth: 2,
    FontSize: styleConstants.FONT_SIZE_DEFAULT,
} as const;