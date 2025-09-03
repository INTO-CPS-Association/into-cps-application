import React, {useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { init, ECharts, EChartsOption } from 'echarts';

type EChartProps = {
  option: EChartsOption;
  chartSettings?: Parameters<typeof init>[2]; 
  optionSettings?: Parameters<ECharts['setOption']>[1];
  style?: React.CSSProperties;
  events?: Record<string, (params: unknown) => void>;
};

export const EChart = forwardRef<ECharts | null, EChartProps>(({
  option,
  chartSettings,
  optionSettings,
  events = {},
  ...props
}, ref) => {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const internalChartRef = useRef<ECharts | null>(null);

  useImperativeHandle(ref, () => internalChartRef.current!, []);

  const resizeChart = () => {
    if (internalChartRef.current) {
      requestAnimationFrame(() => {
        internalChartRef.current?.resize();
      });
    }
  };
  
  useEffect(() => {
    if (!chartRef.current) return;
  
    const chart = init(chartRef.current, null, chartSettings);
    internalChartRef.current = chart;
  
    for (const [event, handler] of Object.entries(events)) {
      chart.on(event, handler);
    }
  
    const resizeObserver = new ResizeObserver(() => resizeChart());
    resizeObserver.observe(chartRef.current);
  
    return () => {
      chart.dispose();
      resizeObserver.disconnect();
      internalChartRef.current = null;
    };
  }, []);

  useEffect(() => {
    internalChartRef.current?.setOption(option, optionSettings);
  }, [option]);

  return <div ref={chartRef} {...props} />;
});
