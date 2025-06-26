import React, { useEffect, useState } from 'react';
import { EChart } from './EChart';
import get from 'lodash.get';

type PlotData = { time: number; value: number };

const MAX_POINTS = 10000;
const WEBSOCKET_URL = 'ws://localhost:8085';

const LivePlotting: React.FC = () => {
  const [data, setData] = useState<PlotData[]>([]);
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

  useEffect(() => {
    const cleanup = createWebSocketWithRetry(
      WEBSOCKET_URL,
      (event) => {
        try {
          const msg = JSON.parse(event.data);
          const level = get(msg, 'data.{wt}.wtInstance.level');

          if (typeof level === 'number') {
            setData((prev) => {
              const updated = [...prev, {
                time: msg.time * 1000,
                value: level,
              }];
              return updated.length > MAX_POINTS ? updated.slice(-MAX_POINTS) : updated;
            });
          }
        } catch (err) {
          console.warn(`[LivePlotting] Failed to parse or extract message: ${err}`);
        }
      },
      () => {}, // onOpen
      () => {}, // onError
      () => {
        setAutoZoomEnd(100);
      }
    );

    return cleanup;
  }, []);

  const total = data.length;
  const zoomRange = 100;

  const option = {
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: data.map((d) => new Date(d.time).toLocaleTimeString()),
      name: 'Time',
    },
    yAxis: {
      type: 'value',
      name: 'Level',
    },
    series: [
      {
        name: 'Level',
        type: 'line',
        data: data.map((d) => d.value),
        smooth: true,
        showSymbol: false,
        lineStyle: {
          width: 2,
        },
      },
    ],
    grid: {
      top: 40,
      bottom: 80,
      left: 50,
      right: 30,
    },
    animation: false,
    dataZoom: [
      {
        type: 'slider',
        xAxisIndex: 0,
        start: autoZoomEnd !== null
          ? Math.max(0, 100 - (zoomRange / total) * 100)
          : 0,
        end: 100,
      },
      {
        type: 'inside',
        xAxisIndex: 0,
        start: autoZoomEnd !== null
          ? Math.max(0, 100 - (zoomRange / total) * 100)
          : 0,
        end: 100,
      },
    ],
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <EChart option={option} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default LivePlotting;