import React from 'react';
import { render, screen, act } from '@testing-library/react';
import LivePlotting from '../../../src/components/LivePlotting';

jest.mock('../../../src/components/EChart', () => ({
  __esModule: true,
  EChart: jest.fn((props) => <div data-testid="mock-echart" {...props} />),
}));

let wsOnMessage: ((ev: MessageEvent) => void) | null = null;
let wsOnOpen: (() => void) | null = null;
let wsOnClose: (() => void) | null = null;
let wsOnError: (() => void) | null = null;

class MockWebSocket {
  constructor() {
    setTimeout(() => {
      wsOnOpen?.();
    }, 0);
  }
  close = jest.fn();
  send = jest.fn();
  set onmessage(cb: (ev: MessageEvent) => void) {
    wsOnMessage = cb;
  }
  set onopen(cb: () => void) {
    wsOnOpen = cb;
  }
  set onclose(cb: () => void) {
    wsOnClose = cb;
  }
  set onerror(cb: () => void) {
    wsOnError = cb;
  }
}

(global as unknown as { WebSocket: typeof WebSocket }).WebSocket = MockWebSocket as unknown as typeof WebSocket;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('LivePlotting Component', () => {
  it('renders EChart', async () => {
    const { default: LivePlotting } = await import('../../../src/components/LivePlotting');
    render(<LivePlotting />);
    const chart = await screen.findByTestId('mock-echart');
    expect(chart).toBeInTheDocument();
  });

  it('updates data when receiving a valid websocket message', async () => {
    await act(async () => {
      render(<LivePlotting />);
    });

    act(() => {
      wsOnMessage?.({
        data: JSON.stringify({
          time: 1234567890,
          data: { signal1: 42 },
        }),
      } as MessageEvent);
    });

    const { EChart: EChartMock } = require('../../../src/components/EChart');
    expect(EChartMock).toHaveBeenCalled();
    const lastCall = EChartMock.mock.calls[EChartMock.mock.calls.length - 1][0];
    expect(lastCall.option.series[0].data).toContain(42);
  });

  it('handles invalid websocket messages without crashing', async () => {
    await act(async () => {
      render(<LivePlotting />);
    });
    act(() => {
      wsOnMessage?.({ data: 'INVALID_JSON' } as MessageEvent);
    });
    expect(require('../../../src/components/EChart').EChart).toHaveBeenCalled();
  });

  it('sets autoZoomEnd when websocket closes', async () => {
    await act(async () => {
      render(<LivePlotting />);
    });
    act(() => {
      wsOnClose?.();
    });
    const { EChart: EChartMock } = require('../../../src/components/EChart');
    const lastCall = EChartMock.mock.calls[EChartMock.mock.calls.length - 1][0];
    expect(lastCall.option.dataZoom[0].end).toBe(100);
  });

  it('handles websocket errors gracefully', async () => {
    await act(async () => {
      render(<LivePlotting />);
    });
    act(() => {
      wsOnError?.();
    });
    expect(require('../../../src/components/EChart').EChart).toHaveBeenCalled();
  });
});