import { renderHook, act } from '@testing-library/react';
import {
    useLivePlottingData,
    getChartOption,
    DataMap,
    extractSignals
} from '../../../../src/components/LivePlotting/useLivePlotting';
import { createWebSocketWithRetry } from '../../../../src/components/LivePlotting/useLivePlotting';
import { MAX_POINTS } from '../../../../src/utils/constants';
import { EChartsOption } from 'echarts';

describe('useLivePlottingData', () => {
    let originalWebSocket: typeof WebSocket;
    let wsInstances: MockWebSocket[] = [];

    class MockWebSocket {
        onopen: () => void = () => { };
        onmessage: (ev: MessageEvent<string>) => void = () => { };
        onclose: () => void = () => { };
        onerror: () => void = () => { };
        send = jest.fn();
        close = jest.fn();

        constructor(public url: string) {
            wsInstances.push(this);
            setTimeout(() => this.onopen(), 0);
        }
    }

    beforeAll(() => {
    originalWebSocket = (globalThis as unknown as { WebSocket?: typeof WebSocket }).WebSocket as typeof WebSocket;
    (globalThis as unknown as { WebSocket?: unknown }).WebSocket = MockWebSocket as unknown as typeof WebSocket;
    });

    afterAll(() => {
    (globalThis as unknown as { WebSocket?: typeof WebSocket }).WebSocket = originalWebSocket;
    });

    beforeEach(() => {
        wsInstances = [];
        jest.clearAllMocks();
    });

    it('initializes with empty data and defaults', () => {
        const { result } = renderHook(() => useLivePlottingData());
        expect(result.current.data).toEqual({});
        expect(result.current.darkMode).toBe(false);
        expect(result.current.autoZoomEnd).toBeNull();
    });

    it('updates data on valid websocket message', () => {
        const { result } = renderHook(() => useLivePlottingData());
        const ws = wsInstances[0];
        act(() => {
            ws.onmessage({
                data: JSON.stringify({
                    time: 123,
                    data: { signal1: 42, nested: { a: 5 } },
                }),
            } as MessageEvent);
        });
        expect(Object.keys(result.current.data).sort()).toEqual(['nested.a', 'signal1']);
        expect(result.current.data.signal1[0].value).toBe(42);
        expect(result.current.data['nested.a'][0].value).toBe(5);
    });

    it('truncates data to MAX_POINTS', () => {
        const { result } = renderHook(() => useLivePlottingData());
        const ws = wsInstances[0];

        act(() => {
            for (let i = 0; i < MAX_POINTS + 10; i++) {
                ws.onmessage({
                    data: JSON.stringify({ time: i, data: { signal1: i } }),
                } as MessageEvent);
            }
        });

        expect(result.current.data.signal1.length).toBe(MAX_POINTS);
        expect(result.current.data.signal1[0].value).toBe(10);
    });

    it('sets autoZoomEnd on websocket close', () => {
        const { result } = renderHook(() => useLivePlottingData());
        const ws = wsInstances[0];

        act(() => ws.onopen());
        act(() => ws.onclose());
        expect(result.current.autoZoomEnd).toBeGreaterThanOrEqual(0);
    });

    it('ignores invalid websocket messages', () => {
        const { result } = renderHook(() => useLivePlottingData());
        const ws = wsInstances[0];

        act(() => ws.onmessage({ data: 'INVALID_JSON' } as MessageEvent));
        expect(result.current.data).toEqual({});
    });

    it('warns on invalid timestamp values', () => {
        const { result } = renderHook(() => useLivePlottingData());
        const ws = wsInstances[0];
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

        act(() => {
            ws.onmessage({
                data: JSON.stringify({ time: 'not-a-number', data: {} }),
            } as MessageEvent);
        });

        expect(warnSpy).toHaveBeenCalledWith('[WS] Invalid timestamp:', 'not-a-number');
        warnSpy.mockRestore();
        expect(result.current.data).toEqual({});
    });

    it('updates existing data point when same timestamp occurs', () => {
        const { result } = renderHook(() => useLivePlottingData());
        const ws = wsInstances[0];

        act(() => {
            ws.onmessage({ data: JSON.stringify({ time: 1000, data: { signal1: 10 } }) } as MessageEvent);
        });

        expect(result.current.data.signal1.length).toBe(1);
        expect(result.current.data.signal1[0].value).toBe(10);

        act(() => {
            ws.onmessage({ data: JSON.stringify({ time: 1000, data: { signal1: 20 } }) } as MessageEvent);
        });

        expect(result.current.data.signal1.length).toBe(1);
        expect(result.current.data.signal1[0].value).toBe(20);
    });
});

describe('getChartOption & extractSignals', () => {

    type SeriesLike = { xAxisIndex?: number; name?: string } & Record<string, unknown>;
    type TooltipWithFormatter = { formatter?: (params: unknown) => string } & Record<string, unknown>;

    it('builds series correctly from data', () => {
        const data: DataMap = {
            signal1: [{ time: 1000, value: 42 }, { time: 2000, value: 55 }],
            signal2: [{ time: 1000, value: 10 }],
        };
        const option: EChartsOption = getChartOption(data, false, null);

        const seriesArray = Array.isArray(option.series) ? option.series : [];
        expect(seriesArray.length).toBeGreaterThanOrEqual(2);
        const simulated = seriesArray.filter(s => (s as SeriesLike).xAxisIndex === 0);
        expect(simulated).toHaveLength(2);
        const simNames = simulated.map(s => (s as SeriesLike).name).sort();
        expect(simNames).toEqual(['signal1', 'signal2']);
    });

    it('handles empty data', () => {
        const option = getChartOption({}, false, null);
        const seriesArray = Array.isArray(option.series) ? option.series : [];
        expect(seriesArray).toEqual([]);
    });

    it('returns empty object for non-object input', () => {
        expect(extractSignals(null)).toEqual({});
        expect(extractSignals(42)).toEqual({});
        expect(extractSignals("test")).toEqual({});
    });

    it('converts boolean values to numbers', () => {
        const obj = { flagTrue: true, flagFalse: false };
        const result = extractSignals(obj);
        expect(result).toEqual({ flagTrue: 1, flagFalse: 0 });
    });

    it('calculates dataZoom start when autoZoomEnd is set', () => {
        const data: DataMap = {
            signal1: Array.from({ length: 500 }, (_, i) => ({ time: i, value: i }))
        };
        const option = getChartOption(data, false, 50);
        const dataZoomArray = Array.isArray(option.dataZoom) ? option.dataZoom : [option.dataZoom];
        const slider = dataZoomArray[0];
        const inside = dataZoomArray[1];
        expect(slider?.start).toBeGreaterThanOrEqual(0);
        expect(inside?.start).toBeGreaterThanOrEqual(0);
    });

    it('tooltip formatter handles arrays, duplicates and real time', () => {
        const data: DataMap = {
            s1: [{ time: 1, value: 10, realTime: 2 }],
            s2: [{ time: 1, value: 20, realTime: 2 }],
        };
        const option = getChartOption(data, false, null);
    const formatter = option.tooltip ? (option.tooltip as unknown as TooltipWithFormatter).formatter : undefined;
        const fmt = typeof formatter === 'function' ? formatter : (() => '');
        expect(fmt('not-array')).toBe('');

        const params = [
            { value: [1, 10], data: [1, undefined, 2], seriesName: 's1' },
            { value: [1, 10, undefined], seriesName: 's1' }, // duplicate series should be skipped
            { value: [1, 20], seriesName: 's2' },
        ];

    const result = fmt(params as unknown);
        expect(result).toEqual(expect.stringContaining('Simulated Time'));
        expect(result).toEqual(expect.stringContaining('Real Time'));
        expect(result).toEqual(expect.stringContaining('s1'));
        expect(result).toEqual(expect.stringContaining('s2'));
    });

    it('createWebSocketWithRetry returns a close function that closes the socket and calls onOpen', () => {
    const originalWS = (globalThis as unknown as { WebSocket?: typeof WebSocket }).WebSocket;
    const createdInstances: Array<{ close: jest.Mock }> = [];
        class LocalMock {
            onopen = () => {};
            onmessage = () => {};
            onerror = () => {};
            onclose = () => {};
            close = jest.fn();
            constructor(public url: string) { createdInstances.push(this as unknown as { close: jest.Mock }); setTimeout(() => this.onopen(), 0); }
        }
        (globalThis as unknown as { WebSocket?: unknown }).WebSocket = LocalMock as unknown as typeof WebSocket;

        jest.useFakeTimers();
        const onOpen = jest.fn();
        const onMsg = jest.fn();
        const onErr = jest.fn();
        const onClose = jest.fn();

        const closeFn = createWebSocketWithRetry('wss://test', onMsg, onOpen, onErr, onClose, 10, 0);
        jest.advanceTimersByTime(0);
        expect(onOpen).toHaveBeenCalled();

    closeFn();
    expect(createdInstances.length).toBeGreaterThan(0);
    expect(createdInstances[0].close).toHaveBeenCalled();

        jest.useRealTimers();
    (globalThis as unknown as { WebSocket?: typeof WebSocket }).WebSocket = originalWS as typeof WebSocket | undefined;
    });
});