describe('getExeca', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('loads execa module once and returns its .execa property', async () => {
    const mockExeca = jest.fn();

    jest.isolateModules(() => {
      jest.mock('execa', () => ({ execa: mockExeca }), { virtual: true });

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getExeca } = require('../../../src/utils/execaWrapper');
      const result1 = getExeca();
      const result2 = getExeca();

      expect(result1).toBe(mockExeca);
      expect(result2).toBe(mockExeca);
    });
  });
});
