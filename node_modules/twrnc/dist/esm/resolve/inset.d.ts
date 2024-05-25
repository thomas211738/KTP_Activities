import type { TwTheme } from '../tw-config';
import type { StyleIR } from '../types';
type Inset = 'bottom' | 'top' | 'left' | 'right' | 'inset';
export declare function inset(type: Inset, value: string, isNegative: boolean, config?: TwTheme['inset']): StyleIR | null;
export {};
