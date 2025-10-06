import { lightTheme, darkTheme } from '../../src/utils/constants/style/themes';
import { lightColors, darkColors } from '../../src/utils/constants';

describe('themes.ts', () => {
  it('should create a light theme with correct palette', () => {
    expect(lightTheme.palette.mode).toBe('light');
    expect(lightTheme.palette.primary.main).toBe(lightColors.primary);
    expect(lightTheme.palette.secondary.main).toBe(lightColors.secondary);
    expect(lightTheme.palette.background.default).toBe(lightColors.background.default);
    expect(lightTheme.palette.background.paper).toBe(lightColors.background.paper);
  });

  it('should create a dark theme with correct palette', () => {
    expect(darkTheme.palette.mode).toBe('dark');
    expect(darkTheme.palette.primary.main).toBe(darkColors.primary);
    expect(darkTheme.palette.secondary.main).toBe(darkColors.secondary);
    expect(darkTheme.palette.background.default).toBe(darkColors.background.default);
    expect(darkTheme.palette.background.paper).toBe(darkColors.background.paper);
  });
});
