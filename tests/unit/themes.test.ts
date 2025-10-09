import { lightTheme, darkTheme } from '../../src/utils/constants/style/themes';
import { LIGHTCOLORS, DARKCOLORS } from '../../src/utils/constants';

describe('themes.ts', () => {
  it('should create a light theme with correct palette', () => {
    expect(lightTheme.palette.mode).toBe('light');
    expect(lightTheme.palette.primary.main).toBe(LIGHTCOLORS.PRIMARY);
    expect(lightTheme.palette.secondary.main).toBe(LIGHTCOLORS.SECONDARY);
    expect(lightTheme.palette.background.default).toBe(LIGHTCOLORS.BACKGROUND.DEFAULT);
    expect(lightTheme.palette.background.paper).toBe(LIGHTCOLORS.BACKGROUND.PAPER);
  });

  it('should create a dark theme with correct palette', () => {
    expect(darkTheme.palette.mode).toBe('dark');
    expect(darkTheme.palette.primary.main).toBe(DARKCOLORS.PRIMARY);
    expect(darkTheme.palette.secondary.main).toBe(DARKCOLORS.SECONDARY);
    expect(darkTheme.palette.background.default).toBe(DARKCOLORS.BACKGROUND.DEFAULT);
    expect(darkTheme.palette.background.paper).toBe(DARKCOLORS.BACKGROUND.PAPER);
  });
});
