import React, { useRef } from 'react';
import { useLivePlottingData } from './useLivePlotting';
import LivePlotting from './LivePlotting';
import { useTheme } from '../../contexts/ThemeContext';

const LivePlottingContainer: React.FC = () => {
  const chartRef = useRef<echarts.ECharts | null>(null);
  const { data, autoZoomEnd } = useLivePlottingData();
  const { darkMode } = useTheme();
  
  return (
    <LivePlotting
      chartRef={chartRef}
      data={data}
      darkMode={darkMode}
      autoZoomEnd={autoZoomEnd}
    />
  );
};

export default LivePlottingContainer;
