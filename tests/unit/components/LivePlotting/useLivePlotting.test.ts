import { renderHook, act } from '@testing-library/react';
import {
    useLivePlottingData,
    MAX_POINTS,
    getChartOption,
    DataMap,
    extractSignals
} from '../../../../src/components/LivePlotting/useLivePlotting';
import { EChartsOption, SeriesOption } from 'echarts';

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
        originalWebSocket = global.WebSocket;
        (global as unknown as { WebSocket: typeof WebSocket }).WebSocket = MockWebSocket as unknown as typeof WebSocket;
    });

    afterAll(() => {
        global.WebSocket = originalWebSocket;
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

        const expected: DataMap = {
            signal1: [{ time: 123000, value: 42 }],
            'nested.a': [{ time: 123000, value: 5 }],
        };
        expect(result.current.data).toEqual(expected);
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

        act(() => ws.onclose());
        expect(result.current.autoZoomEnd).toBe(100);
    });

    it('ignores invalid websocket messages', () => {
        const { result } = renderHook(() => useLivePlottingData());
        const ws = wsInstances[0];

        act(() => ws.onmessage({ data: 'INVALID_JSON' } as MessageEvent));
        expect(result.current.data).toEqual({});
    });
});

describe('getChartOption & extractSignals', () => {

    it('builds series correctly from data', () => {
        const data: DataMap = {
            signal1: [{ time: 1000, value: 42 }, { time: 2000, value: 55 }],
            signal2: [{ time: 1000, value: 10 }],
        };
        const option: EChartsOption = getChartOption(data, false, null);

        const seriesArray = Array.isArray(option.series) ? option.series : [];
        expect(seriesArray).toHaveLength(2);

        const series0 = seriesArray[0] as SeriesOption;
        const series1 = seriesArray[1] as SeriesOption;

        expect(series0.name).toBe('signal1');
        expect(series0.data).toEqual([42, 55]);
        expect(series1.name).toBe('signal2');
        expect(series1.data).toEqual([10]);
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
});