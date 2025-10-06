import { useState, useEffect, useRef } from 'react';
import { EChartsOption } from 'echarts';
import { MAX_POINTS, ZOOM_RANGE, AUTO_ZOOM_END, MAX_SLIDER_PERCENT, WEBSOCKET, ChartLabels, ChartDimensions, DataZoomTypes, ChartSeriesDefaults, ChartStyles } from "../../utils/constants";

export type PlotData = { time: number; value: number, realTime?: number };
export type DataMap = Record<string, PlotData[]>;

// --- DATA MAP VALIDATION ---
export function validateDataMap(data: DataMap): DataMap {
  const validData: DataMap = {};
  for (const [key, values] of Object.entries(data)) {
    if (typeof key !== 'string') continue;
    const validValues = values.filter(v => typeof v.time === 'number' && typeof v.value === 'number');
    if (validValues.length > 0) validData[key] = validValues;
  }
  return validData;
}


// --- SIGNALS EXTRACTION ---
export function extractSignals(obj: unknown, prefix = ''): Record<string, number> {
  const result: Record<string, number> = {};
  if (typeof obj !== 'object' || obj === null) return result;

  for (const key in obj as Record<string, unknown>) {
    const value = (obj as Record<string, unknown>)[key];
    const cleanKey = key.replace(/^{|}$/g, '');
    const path = prefix ? `${prefix}.${cleanKey}` : cleanKey;

    if (typeof value === 'number') result[path] = value;
    else if (typeof value === 'boolean') result[path] = value ? 1 : 0;
    else if (typeof value === 'object' && value !== null) {
      const nestedSignals = extractSignals(value, path);
      Object.assign(result, nestedSignals);
    }
  }
  return result;
}

// --- CHART OPTIONS ---
export function getChartOption(data: DataMap, darkMode: boolean, autoZoomEnd: number | null): EChartsOption {
  const total = Object.values(data)[0]?.length || 0;

  const filteredData = validateDataMap(
    Object.fromEntries(
      Object.entries(data).filter(([key, values]) =>
        key !== "dummy" && values && values.length > 0
      )
    )
  );

  return {
    backgroundColor: darkMode ? ChartStyles.Dark.Background : ChartStyles.Light.Background,
    textStyle: { color: darkMode ? ChartStyles.Dark.Text : ChartStyles.Light.Text },
    tooltip: {
      trigger: 'axis',
      backgroundColor: darkMode ? ChartStyles.Dark.TooltipBg : ChartStyles.Light.TooltipBg,
      textStyle: { color: darkMode ? ChartStyles.Dark.TooltipText : ChartStyles.Light.TooltipText },
      formatter: (params: any) => {
        if (!Array.isArray(params)) return '';
        const simulated = params[0].value[0];
        const real = params[0].data[2];

        let result = `Simulated Time: ${simulated.toFixed(2)}s<br/>`;
        if (real !== undefined) result += `Real Time: ${real.toFixed(2)}s<br/>`;

        const seenSeries = new Set<string>();
        params.forEach((param: any) => {
          if (seenSeries.has(param.seriesName)) return;
          seenSeries.add(param.seriesName);
          result += `${param.seriesName}: ${param.value[1].toFixed(4)}<br/>`;
        });

        return result;
      }
    },
    legend: {
      show: true,
      data: Object.keys(filteredData),
      textStyle: { color: darkMode ? ChartStyles.Dark.Text : ChartStyles.Light.Text },
      top: 10,
      right: 20,
      backgroundColor: darkMode ? '#222' : '#fff',
      borderRadius: 5,
      padding: [5, 10]
    },
    xAxis:
      [
        {
          type: 'value',
          name: ChartLabels.SimulatedTime,
          axisLine: { lineStyle: { color: darkMode ? ChartStyles.Dark.Axis : ChartStyles.Light.Axis } },
          axisLabel: {
            color: darkMode ? ChartStyles.Dark.Axis : ChartStyles.Light.Axis,
            formatter: val => val.toFixed(2),
          },
        },
        {
          type: 'value',
          name: ChartLabels.RealTime,
          axisLine: { show: true, lineStyle: { color: darkMode ? ChartStyles.Dark.Axis : ChartStyles.Light.Axis } },
          axisLabel: {
            formatter: (val: number) => `${val.toFixed(1)}s`,
            showMinLabel: true,
            showMaxLabel: true
          },
          splitLine: { show: false },
          axisTick: { show: false },
          position: 'bottom',
          offset: 20
        }
      ],
    yAxis: {
      type: 'value',
      name: ChartLabels.Value,
      axisLine: { lineStyle: { color: darkMode ? ChartStyles.Dark.Axis : ChartStyles.Light.Axis } },
      axisLabel: { color: darkMode ? ChartStyles.Dark.Axis : ChartStyles.Light.Axis },
    },
    series: [
      ...Object.entries(filteredData).map(([key, values]) => ({
        name: key,
        type: 'line' as const,
        xAxisIndex: 0, // Simulated Time
        data: values.map(d => [d.time, d.value, d.realTime]),
        smooth: ChartSeriesDefaults.smooth,
        showSymbol: ChartSeriesDefaults.showSymbol,
        lineStyle: { width: ChartStyles.LineWidth },
        connectNulls: false,
      })),
      ...Object.entries(filteredData).map(([key, values]) => ({
        name: key + '_realTime',
        type: 'line' as const,
        xAxisIndex: 1,
        data: values.map(d => [d.realTime ?? 0, d.value]),
        lineStyle: { width: 0 },
        showSymbol: false,
        tooltip: { show: false },
        emphasis: { focus: 'none' as const },
        silent: true,
        legendHoverLink: false,
      }))
    ],
    grid: ChartStyles.Grid,
    animation: true,
    dataZoom: [
      {
        type: DataZoomTypes.Slider,
        xAxisIndex: [0, 1],
        bottom: ChartDimensions.DataZoom.bottom,
        height: ChartDimensions.DataZoom.height,
        start: autoZoomEnd !== null ? Math.max(0, MAX_SLIDER_PERCENT - (ZOOM_RANGE / total) * MAX_SLIDER_PERCENT) : 0,
        end: AUTO_ZOOM_END
      },
      {
        type: DataZoomTypes.Inside,
        xAxisIndex: [0, 1],
        start: autoZoomEnd !== null ? Math.max(0, MAX_SLIDER_PERCENT - (ZOOM_RANGE / total) * MAX_SLIDER_PERCENT) : 0,
        end: AUTO_ZOOM_END
      }
    ]

  };
}

// --- WEBSOCKET HOOK ---
export function useLivePlottingData(chartRef?: React.RefObject<any>) {
  const [data, setData] = useState<DataMap>({});
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [autoZoomEnd, setAutoZoomEnd] = useState<number | null>(null);
  const [simulationStarted, setSimulationStarted] = useState(true);
  const startTsRef = useRef<number | null>(null);

  // Needed for lazy connect
  useEffect(() => {
    const handler = () => setSimulationStarted(true);
    window.electronAPI.on('menu-start-simulation', handler);

    return () => {
      window.electronAPI.off('menu-start-simulation', handler);
    };
  }, []);

  useEffect(() => {
    if (!simulationStarted) return;

    let retries = 0;
    let socket: WebSocket;

    const connect = () => {
      socket = new WebSocket(WEBSOCKET.URL);
      socket.onopen = () => {
        console.log('[WS] Connected at: ' + WEBSOCKET.URL);
        retries = 0;
        setAutoZoomEnd(AUTO_ZOOM_END);
      };
      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const timestamp = msg.time;
          if (typeof timestamp !== 'number' || isNaN(timestamp)) {
            console.warn('[WS] Invalid timestamp:', msg.time);
            return;
          }

          if (startTsRef.current === null) {
            startTsRef.current = timestamp;
          }

          const relTs = timestamp - (startTsRef.current ?? 0);
          const realTimeSec = (performance.now() - (startTsRef.current ?? performance.now())) / 1000;

          const signals = extractSignals(msg.data);
          setData(prev => {
            const updated: DataMap = { ...prev };
            for (const [key, value] of Object.entries(signals)) {
              if (!updated[key]) updated[key] = [];
              const existingIndex = updated[key].findIndex(p => p.time === relTs);
              if (existingIndex >= 0)
                updated[key][existingIndex] = { ...updated[key][existingIndex], value, realTime: realTimeSec };
              else
                updated[key].push({ time: relTs, value, realTime: realTimeSec });
              if (updated[key].length > MAX_POINTS)
                updated[key] = updated[key].slice(-MAX_POINTS);
            }
            return updated;
          });

        } catch (e) {
          console.error('WS parse error', e);
        }
      };

      socket.onerror = () => { };
      socket.onclose = () => {
        if (retries < WEBSOCKET.MAX_RETRIES) {
          retries++;
          setTimeout(connect, WEBSOCKET.RETRY_DELAY);

        }
      };
    };

    connect();

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [simulationStarted]);

  return { data, darkMode, autoZoomEnd, setDarkMode };
}

// --- WEBSOCKET UTILITY ---
export function createWebSocketWithRetry(
  url: string,
  onMessage: (event: MessageEvent) => void,
  onOpen: () => void,
  onError: () => void,
  onClose: () => void,
  retryDelay: number,
  maxRetries: number,
) {
  let retries = 0;
  let socket: WebSocket;

  const connect = () => {
    socket = new WebSocket(url);

    socket.onopen = () => { onOpen(); retries = 0; };
    socket.onmessage = onMessage;
    socket.onerror = () => { onError(); };
    socket.onclose = () => {
      onClose();
      if (retries < maxRetries) { retries++; setTimeout(connect, retryDelay); }
    };
  };

  connect();
  return () => socket.close();
}
