import type { TwTheme } from '../tw-config';
import type { Direction, ParseContext, StyleIR } from '../types';
export default function spacing(type: 'margin' | 'padding', direction: Direction, value: string, context: ParseContext, config?: TwTheme['margin'] | TwTheme['padding']): StyleIR | null;
