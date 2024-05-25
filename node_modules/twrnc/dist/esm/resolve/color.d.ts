import type { ColorStyleType, Style, StyleIR } from '../types';
import type { TwColors } from '../tw-config';
export declare function color(type: ColorStyleType, value: string, config?: TwColors): StyleIR | null;
export declare function colorOpacity(type: ColorStyleType, value: string): StyleIR | null;
export declare function removeOpacityHelpers(style: Style): void;
export declare function configColor(colorName: string, config: TwColors): string | null;
