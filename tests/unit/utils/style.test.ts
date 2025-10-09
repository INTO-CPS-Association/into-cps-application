import { LIGHTCOLORS, DARKCOLORS } from '../../../src/utils/constants/style/colorsConstants';
import { styleConstants } from '../../../src/utils/constants/style/styleConstants';

describe('colorsConstant', () => {
    it('should contain correct values for lightColors', () => {
        expect(LIGHTCOLORS.PRIMARY).toBe('#3f51b5');
        expect(LIGHTCOLORS.SECONDARY).toBe('#f50057');
        expect(LIGHTCOLORS.BACKGROUND).toEqual({
            DEFAULT: '#f5f5f5',
            PAPER: '#ffffff',
        });
    });

    it('should contain correct values for darkColors', () => {
        expect(DARKCOLORS.PRIMARY).toBe('#90caf9');
        expect(DARKCOLORS.SECONDARY).toBe('#f48fb1');
        expect(DARKCOLORS.BACKGROUND).toEqual({
            DEFAULT: '#121212',
            PAPER: '#1e1e1e',
        });
    });
});

describe('styleConstants', () => {
    it('should contain correct style constants', () => {
        expect(styleConstants).toEqual(expect.objectContaining({
            SIDEBAR: expect.objectContaining({
                INNER_WIDTH_SIZE: 768,
                DRAWER_WIDTH: 240,
                COLLAPSED_WIDTH: 64,
                TRANSITION_DURATION: 0.3,
                TOOLBAR_HEIGHT: 64,
            }),
            FONT_SIZE_DEFAULT: '1.0em',
            VERTICAL_ALIGN_DEFAULT: '0.1em',
        }));
    });
});