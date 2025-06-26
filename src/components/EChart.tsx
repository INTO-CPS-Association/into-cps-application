import React, { useMemo, useRef, useEffect } from 'react';
import { init, getInstanceByDom } from 'echarts';
import { debounce } from 'lodash';

type EChartProps = {
  option: any;
  chartSettings?: any;
  optionSettings?: any;
  style?: React.CSSProperties;
  events?: Record<string, (params: any) => void>;
};

export const EChart: React.FC<EChartProps> = ({
  option,
  chartSettings,
  optionSettings,
  style = { width: '100%', height: '350px' },
  events = {},
  ...props
}) => {
  const chartRef = useRef<HTMLDivElement | null>(null);

  const resizeChart = useMemo(
    () =>
      debounce(() => {
        if (chartRef.current) {
          const chart = getInstanceByDom(chartRef.current);
          chart?.resize();
        }
      }, 50),
    []
  );

  useEffect(() => {
    const chart = init(chartRef.current!, null, chartSettings);

    for (const [event, handler] of Object.entries(events)) {
      chart.on(event, handler);
    }

    const resizeObserver = new ResizeObserver(() => resizeChart());
    resizeObserver.observe(chartRef.current!);

    return () => {
      chart.dispose();
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const chart = getInstanceByDom(chartRef.current!);
    chart?.setOption(option, optionSettings);
  }, [option]);

  return <div ref={chartRef} style={style} {...props} />;
};