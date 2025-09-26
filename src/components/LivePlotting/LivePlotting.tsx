import React, { useRef } from 'react';
import { EChart } from '../EChart';
import { getChartOption, DataMap } from './useLivePlotting';

interface LivePlottingProps {
  data: DataMap;
  darkMode?: boolean;
  autoZoomEnd?: number | null;
}

const LivePlotting: React.FC<LivePlottingProps> = ({ data, darkMode = false, autoZoomEnd = null }) => {
  const chartRef = useRef<echarts.ECharts | null>(null);

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      overflow: 'hidden',
      backgroundColor: darkMode ? '#1e1e1e' : '#fff',
    }}>
      <EChart
        ref={chartRef}
        option={getChartOption(data, darkMode, autoZoomEnd)}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default LivePlotting;