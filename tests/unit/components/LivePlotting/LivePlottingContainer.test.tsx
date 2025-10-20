import React from 'react';
import { render } from '@testing-library/react';

jest.mock('../../../../src/components/LivePlotting/LivePlotting', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock('../../../../src/components/LivePlotting/useLivePlotting', () => ({
  useLivePlottingData: jest.fn(() => ({ data: [], autoZoomEnd: false })),
}));

jest.mock('../../../../src/contexts/ThemeContext', () => ({
  useTheme: jest.fn(() => ({ darkMode: true })),
}));

import LivePlotting from '../../../../src/components/LivePlotting/LivePlotting';
import { useLivePlottingData } from '../../../../src/components/LivePlotting/useLivePlotting';
import { useTheme } from '../../../../src/contexts/ThemeContext';
import LivePlottingContainer from '../../../../src/components/LivePlotting/LivePlottingContainer';

describe('LivePlottingContainer', () => {
  it('passes hook data and theme to LivePlotting component', () => {
    (useLivePlottingData as jest.Mock).mockReturnValue({ data: [{ x: 1, y: 2 }], autoZoomEnd: true });
    (useTheme as jest.Mock).mockReturnValue({ darkMode: false });

    render(<LivePlottingContainer />);

    expect(LivePlotting).toHaveBeenCalled();
    const props = (LivePlotting as jest.Mock).mock.calls[0][0];
    expect(props.data).toEqual([{ x: 1, y: 2 }]);
    expect(props.autoZoomEnd).toBe(true);
    expect(props.darkMode).toBe(false);
    expect(props.chartRef).toBeDefined();
  });
});
