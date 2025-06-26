import { lightColors, darkColors } from '../../../src/utils/constants/style/colorsConstants';
import { styleConstants } from '../../../src/utils/constants/style/styleConstants';

describe('colorsConstant', () => {
    it('should contain correct values for lightColors', () => {
        expect(lightColors.primary).toBe('#3f51b5');
        expect(lightColors.secondary).toBe('#f50057');
        expect(lightColors.background).toEqual({
            default: '#f5f5f5',
            paper: '#ffffff',
        });
    });

    it('should contain correct values for darkColors', () => {
        expect(darkColors.primary).toBe('#90caf9');
        expect(darkColors.secondary).toBe('#f48fb1');
        expect(darkColors.background).toEqual({
            default: '#121212',
            paper: '#1e1e1e',
        });
    });
});

describe('styleConstants', () => {
    it('should contain correct style constants', () => {
        expect(styleConstants).toEqual({
            INNER_WIDTH_SIZE: 768,
            DRAWER_WIDTH: 240,
            COLLAPSED_WIDTH: 64,
            TRANSITION_DURATION: 0.3,
            TOOLBAR_HEIGHT: 64,
            FONT_SIZE_DEFAULT: '1.0em',
            VERTICAL_ALIGN_DEFAULT: '0.1em',
        });
    });
});