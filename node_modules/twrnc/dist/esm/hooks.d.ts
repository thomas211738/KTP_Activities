import type { TailwindFn, RnColorScheme } from './types';
type AppOptions = {
    observeDeviceColorSchemeChanges: false;
    initialColorScheme: 'device' | 'light' | 'dark';
};
export declare function useDeviceContext(tw: TailwindFn, appOptions?: AppOptions): void;
export declare function useAppColorScheme(tw: TailwindFn): [
    colorScheme: RnColorScheme,
    toggleColorScheme: () => void,
    setColorScheme: (colorScheme: RnColorScheme) => void
];
export {};
