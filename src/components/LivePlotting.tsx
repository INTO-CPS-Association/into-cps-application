import React, { useEffect, useState } from 'react';
import { EChart } from './EChart';
import { EChartsOption } from 'echarts';

type PlotData = { time: number; value: number };
type DataMap = Record<string, PlotData[]>;

const MAX_POINTS = 10000;
const WEBSOCKET_URL = 'ws://localhost:8085';

const LivePlotting: React.FC = () => {
  const [data, setData] = useState<DataMap>({});
  const [autoZoomEnd, setAutoZoomEnd] = useState<number | null>(null);

  function createWebSocketWithRetry(
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

      socket.onopen = () => {
        console.log(`[LivePlotting] WebSocket connected after ${retries} retries`);
        onOpen();
        retries = 0;
      };

      socket.onmessage = onMessage;

      socket.onerror = () => {
        console.warn('[LivePlotting] WebSocket error');
        onError();
      };

      socket.onclose = () => {
        console.log('[LivePlotting] WebSocket closed');
        onClose();

        if (retries < maxRetries) {
          retries++;
          setTimeout(connect, retryDelay);
        }
      };
    };

    connect();
    return () => socket.close();
  }

  function extractSignals(obj: unknown, prefix = ''): Record<string, number> {
    const result: Record<string, number> = {};
    if (typeof obj !== 'object' || obj === null) return result;

    for (const key in obj as Record<string, unknown>) {
      const value = (obj as Record<string, unknown>)[key];
      const path = prefix ? `${prefix}.${key}` : key;

      if (typeof value === 'number') {
        result[path] = value;
      } else if (typeof value === 'boolean') {
        result[path] = value ? 1 : 0;
      } else if (typeof value === 'object' && value !== null) {
        Object.assign(result, extractSignals(value, path));
      }
    }

    return result;
  }

  useEffect(() => {
    const cleanup = createWebSocketWithRetry(
      WEBSOCKET_URL,
      (event) => {
        try {
          const msg = JSON.parse(event.data);
          const timestamp = msg.time * 1000;
          const signals = extractSignals(msg.data);

          setData((prev) => {
            const updated: DataMap = { ...prev };

            for (const key in signals) {
              const value = signals[key];

              if (!updated[key]) updated[key] = [];
              updated[key].push({ time: timestamp, value });

              if (updated[key].length > MAX_POINTS) {
                updated[key] = updated[key].slice(-MAX_POINTS);
              }
            }

            return updated;
          });
        } catch (err) {
          console.warn(`[LivePlotting] Failed to parse or extract message: ${err}`);
        }
      },
      () => { }, // onOpen
      () => { }, // onError
      () => {
        setAutoZoomEnd(100);
      }
    );

    return cleanup;
  }, []);

  const total = Object.values(data)[0]?.length || 0;
  const zoomRange = 100;
  const timeLabels =
    Object.values(data)[0]?.map((d) => new Date(d.time).toLocaleTimeString()) || [];

  const option: EChartsOption = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: timeLabels, name: 'Time' },
    yAxis: { type: 'value', name: 'Value' },
    series: Object.entries(data).map(([key, values]) => ({
      name: key,
      type: 'line' as const,
      data: values.map((d) => d.value),
      smooth: true,
      showSymbol: false,
      lineStyle: { width: 2 },
    })),
    grid: { top: 40, bottom: 80, left: 50, right: 30 },
    animation: false,
    dataZoom: [
      { type: 'slider' as const, xAxisIndex: 0, start: autoZoomEnd !== null ? Math.max(0, 100 - (zoomRange / total) * 100) : 0, end: 100 },
      { type: 'inside' as const, xAxisIndex: 0, start: autoZoomEnd !== null ? Math.max(0, 100 - (zoomRange / total) * 100) : 0, end: 100 },
    ],
  };


  return (
    <div style={{ width: '100%', height: '100%' }}>
      <EChart option={option} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default LivePlotting;