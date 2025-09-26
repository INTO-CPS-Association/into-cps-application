import { useState, useEffect } from 'react';
import { EChartsOption } from 'echarts';

export type PlotData = { time: number; value: number };
export type DataMap = Record<string, PlotData[]>;

export const MAX_POINTS = 10000;
export const WEBSOCKET_URL = 'ws://localhost:8085';

// --- SIGNALS EXTRACTION ---
export function extractSignals(obj: unknown, prefix = ''): Record<string, number> {
  const result: Record<string, number> = {};
  if (typeof obj !== 'object' || obj === null) return result;

  for (const key in obj as Record<string, unknown>) {
    const value = (obj as Record<string, unknown>)[key];
    const path = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'number') result[path] = value;
    else if (typeof value === 'boolean') result[path] = value ? 1 : 0;
    else if (typeof value === 'object' && value !== null)
      Object.assign(result, extractSignals(value, path));
  }
  return result;
}

// --- CHART OPTIONS ---
export function getChartOption(data: DataMap, darkMode: boolean, autoZoomEnd: number | null): EChartsOption {
  const total = Object.values(data)[0]?.length || 0;
  const zoomRange = 100;
  const timeLabels = Object.values(data)[0]?.map(d => new Date(d.time).toLocaleTimeString()) || [];

  return {
    backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
    textStyle: { color: darkMode ? '#ffffff' : '#000000' },
    tooltip: {
      trigger: 'axis',
      backgroundColor: darkMode ? '#333' : '#fff',
      textStyle: { color: darkMode ? '#fff' : '#000' }
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: timeLabels,
      name: 'Time',
      nameLocation: 'end',
      nameGap: 10,
      axisLine: { lineStyle: { color: darkMode ? '#aaa' : '#333' } },
      axisLabel: { color: darkMode ? '#aaa' : '#333', rotate: 45, interval: 'auto' },
    },
    yAxis: {
      type: 'value',
      name: 'Value',
      axisLine: { lineStyle: { color: darkMode ? '#aaa' : '#333' } },
      axisLabel: { color: darkMode ? '#aaa' : '#333' },
    },
    series: Object.entries(data).map(([key, values]) => ({
      name: key,
      type: 'line' as const,
      data: values.map(d => d.value),
      smooth: true,
      showSymbol: false,
      lineStyle: { width: 2 },
    })),
    grid: { top: 40, bottom: 40, left: 50, right: 80, containLabel: true },
    animation: false,
    dataZoom: [
      {
        type: 'slider' as const,
        bottom: 20,
        height: 20,
        xAxisIndex: 0,
        start: autoZoomEnd !== null ? Math.max(0, 100 - (zoomRange / total) * 100) : 0,
        end: 100
      },
      {
        type: 'inside' as const,
        xAxisIndex: 0,
        start: autoZoomEnd !== null ? Math.max(0, 100 - (zoomRange / total) * 100) : 0,
        end: 100
      },
    ],
  };
}

// --- WEBSOCKET HOOK ---
export function useLivePlottingData() {
  const [data, setData] = useState<DataMap>({});
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [autoZoomEnd, setAutoZoomEnd] = useState<number | null>(null);

  useEffect(() => {
    const cleanup = createWebSocketWithRetry(
      WEBSOCKET_URL,
      (event) => {
        try {
          const msg = JSON.parse(event.data);
          const timestamp = msg.time * 1000;
          const signals = extractSignals(msg.data);

          setData(prev => {
            const updated: DataMap = { ...prev };
            for (const key in signals) {
              if (!updated[key]) updated[key] = [];
              updated[key].push({ time: timestamp, value: signals[key] });
              if (updated[key].length > MAX_POINTS) updated[key] = updated[key].slice(-MAX_POINTS);
            }
            return updated;
          });
        } catch { /* ignore */ }
      },
      () => {}, // onOpen
      () => {}, // onError
      () => setAutoZoomEnd(100) // onClose
    );

    return cleanup;
  }, []);

  return { data, darkMode, autoZoomEnd, setDarkMode };
}

// --- WEBSOCKET UTILITY ---
export function createWebSocketWithRetry(
  url: string,
  onMessage: (event: MessageEvent) => void,
  onOpen: () => void,
  onError: () => void,
  onClose: () => void,
  retryDelay = 1000,
  maxRetries = 10
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
