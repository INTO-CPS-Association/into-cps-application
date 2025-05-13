import React, { useEffect, useRef, useState } from 'react';
import Plot from 'react-plotly.js';
import get from 'lodash.get';

type PlotData = { time: number; value: number };

const LivePlotting: React.FC = () => {
  const [data, setData] = useState<PlotData[]>([]);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8085');
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('[LivePlotting] WebSocket connected');
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const level = get(msg, 'data.{wt}.wtInstance.level');

        if (typeof level === 'number') {
          setData((prev) => [
            ...prev.slice(-100),
            {
              time: msg.time * 1000,
              value: level,
            },
          ]);
        }
      } catch (err) {
        console.warn('[LivePlotting] Failed to parse or extract message:', err);
      }
    };

    socket.onerror = () => {
      console.warn('[LivePlotting] WebSocket error');
    };

    socket.onclose = () => {
      console.warn('[LivePlotting] WebSocket closed');
    };

    return () => {
      socket.close();
    };
  }, []);

  const times = data.map((d) => new Date(d.time).toLocaleTimeString());
  const values = data.map((d) => d.value);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Plot
        data={[
          {
            x: times,
            y: values,
            type: 'scatter',
            mode: 'lines',
            line: { color: '#8884d8' },
          },
        ]}
        layout={{
          autosize: true,
          margin: { t: 30, l: 50, r: 30, b: 50 },
          xaxis: { title: 'Time', type: 'category' },
          yaxis: { title: 'Level' },
          dragmode: 'pan',
        }}
        useResizeHandler
        style={{ width: '100%', height: '100%' }}
        config={{
          responsive: true,
          scrollZoom: true,
          displayModeBar: false
        }}
      />
    </div>
  );
};

export default LivePlotting;