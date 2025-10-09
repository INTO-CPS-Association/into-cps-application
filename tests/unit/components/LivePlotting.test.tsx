import React from 'react';
import { render, screen } from '@testing-library/react';
import LivePlotting from '../../../src/components/LivePlotting/LivePlotting';
import { DataMap, useLivePlottingData } from '../../../src/components/LivePlotting/useLivePlotting';

jest.mock('../../../src/components/EChart', () => {
  const React = require('react');
  return {
    __esModule: true,
    EChart: React.forwardRef((props: any, ref: any) => {
      const fakeChart = {
        setOption: jest.fn(),
      };
      React.useEffect(() => {
        if (ref) {
          if (typeof ref === 'function') ref(fakeChart);
          else ref.current = fakeChart;
        }
        return () => {
          if (ref) {
            if (typeof ref === 'function') ref(null);
            else ref.current = null;
          }
        };
      }, [ref]);

      return <div data-testid="mock-echart" {...props} />;
    }),
  };
});

jest.mock('../../../src/components/LivePlotting/useLivePlotting', () => ({
  ...jest.requireActual('../../../src/components/LivePlotting/useLivePlotting'),
  useLivePlottingData: jest.fn(),
}));

describe('LivePlotting Component', () => {
  let mockHookReturn: {
    data: DataMap;
    darkMode: boolean;
    autoZoomEnd: number | null;
    setDarkMode: jest.Mock<void, [boolean]>;
  };
 
  let chartRef: React.RefObject<any>;

  beforeEach(() => {
    mockHookReturn = {
      data: { signal1: [{ time: 1, value: 0 }] },
      darkMode: false,
      autoZoomEnd: null,
      setDarkMode: jest.fn(),
    };
    (useLivePlottingData as jest.Mock).mockReturnValue(mockHookReturn);
    jest.clearAllMocks();
    chartRef = React.createRef();
  });

  it('renders EChart with hook data', () => {
    render(<LivePlotting data={{}} chartRef={chartRef} darkMode={false} />);
    const chart = screen.getByTestId('mock-echart');
    expect(chart).toBeInTheDocument();
  });

  it('applies darkMode correctly', () => {
    render(<LivePlotting data={{}} darkMode={true} chartRef={chartRef} />);
    const chartContainer = screen.getByTestId('mock-echart').parentElement;
    expect(chartContainer).toHaveStyle('background-color: #1e1e1e');
  });  

  it('renders with autoZoomEnd', () => {
    mockHookReturn.autoZoomEnd = 100;
    (useLivePlottingData as jest.Mock).mockReturnValue(mockHookReturn);
    render(<LivePlotting data={{}} chartRef={chartRef} darkMode={false} />);
    expect(screen.getByTestId('mock-echart')).toBeInTheDocument();
  });
});