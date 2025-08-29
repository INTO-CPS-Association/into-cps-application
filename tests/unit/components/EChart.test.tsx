import React from 'react';
import { render, act, cleanup } from '@testing-library/react';
import { EChart } from '../../../src/components/EChart';
import { init, getInstanceByDom } from 'echarts';

const mockResize = jest.fn();
const mockDispose = jest.fn();
const mockSetOption = jest.fn();
const mockOn = jest.fn();

jest.mock('echarts', () => ({
  init: jest.fn(),
  getInstanceByDom: jest.fn(),
}));

const observeMock = jest.fn();
const disconnectMock = jest.fn();
let resizeCallback: () => void;

const ResizeObserverMock = jest.fn((cb: () => void) => {
  resizeCallback = cb;
  return {
    observe: observeMock,
    disconnect: disconnectMock,
  };
});

(global as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

describe('EChart component', () => {
  let chartInstance: {
    resize: jest.Mock;
    dispose: jest.Mock;
    setOption: jest.Mock;
    on: jest.Mock;
  };

  beforeEach(() => {
    chartInstance = {
      resize: mockResize,
      dispose: mockDispose,
      setOption: mockSetOption,
      on: mockOn,
    };

    (init as jest.Mock).mockReturnValue(chartInstance);
    (getInstanceByDom as jest.Mock).mockReturnValue(chartInstance);

    jest.clearAllMocks();
    ResizeObserverMock.mockClear();
    observeMock.mockClear();
    disconnectMock.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('should initialize echarts instance on mount', () => {
    render(<EChart option={{ title: { text: 'Test' } }} />);
    expect(init).toHaveBeenCalled();
  });

  it('should register events passed in props', () => {
    const clickHandler = jest.fn();
    render(<EChart option={{}} events={{ click: clickHandler, mouseover: jest.fn() }} />);
    expect(mockOn).toHaveBeenCalledWith('click', clickHandler);
    expect(mockOn).toHaveBeenCalledWith('mouseover', expect.any(Function));
  });

  it('should set option when option prop changes', () => {
    const { rerender } = render(<EChart option={{ a: 1 }} />);
    expect(mockSetOption).toHaveBeenCalledWith({ a: 1 }, undefined);

    rerender(<EChart option={{ a: 2 }} optionSettings={{ notMerge: true }} />);
    expect(mockSetOption).toHaveBeenCalledWith({ a: 2 }, { notMerge: true });
  });

  it('should call resize on ResizeObserver trigger', () => {
    jest.useFakeTimers();
    render(<EChart option={{}} />);

    act(() => {
      resizeCallback();
      jest.advanceTimersByTime(51); // debounce
    });

    expect(mockResize).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('should dispose chart and disconnect observer on unmount', () => {
    const { unmount } = render(<EChart option={{}} />);
    unmount();
    expect(mockDispose).toHaveBeenCalled();
    expect(disconnectMock).toHaveBeenCalled();
  });
});