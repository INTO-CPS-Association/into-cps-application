import React, { useEffect } from 'react';
import { EChart } from '../EChart';
import { getChartOption, DataMap } from './useLivePlotting';
import { ChartStyles } from '../../utils/constants/livePlot/plotting';

interface LivePlottingProps {
  chartRef: React.RefObject<echarts.ECharts | null>;
  data: DataMap;
  darkMode: boolean;
  autoZoomEnd?: number | null;
}

const LivePlotting: React.FC<LivePlottingProps> = ({ chartRef, data, darkMode, autoZoomEnd = null }) => {
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.setOption(getChartOption(data, darkMode, autoZoomEnd), true);
    }
  }, [data, darkMode, autoZoomEnd, chartRef]);

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      overflow: 'hidden',
      backgroundColor: darkMode ? ChartStyles.Dark.Background : ChartStyles.Light.Background,
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