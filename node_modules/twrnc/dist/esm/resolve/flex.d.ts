import type { TwTheme } from '../tw-config';
import type { ParseContext, StyleIR } from '../types';
export declare function flexGrowShrink(type: 'Grow' | 'Shrink', value: string, config?: TwTheme['flexGrow'] | TwTheme['flexShrink']): StyleIR | null;
export declare function flex(value: string, config?: TwTheme['flex']): StyleIR | null;
export declare function flexBasis(value: string, context?: ParseContext, config?: TwTheme['flexBasis']): StyleIR | null;
export declare function gap(value: string, context?: ParseContext, config?: TwTheme['gap']): StyleIR | null;
