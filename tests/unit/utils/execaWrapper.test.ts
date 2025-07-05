describe('getExeca', () => {
    beforeEach(() => {
      jest.resetModules();
    });
  
    it('loads execa module once and returns its .execa property', () => {
      const mockExeca = jest.fn();
      jest.mock('execa', () => ({ execa: mockExeca }), { virtual: true });
  
      const { getExeca } = require('../../../src/utils/execaWrapper');
      const result1 = getExeca();
      const result2 = getExeca();
  
      expect(result1).toBe(mockExeca);
      expect(result2).toBe(mockExeca);
    });
  });
  