import type { TwTheme } from './tw-config';
type Screens = Record<string, [min: number, max: number, order: number]>;
export default function screens(input?: TwTheme['screens']): Screens;
export {};
