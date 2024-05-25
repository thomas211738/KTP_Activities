import type { StyleIR, Style } from './types';
export default class Cache {
    private ir;
    private styles;
    private prefixes;
    constructor(customStyles?: Array<[string, StyleIR]>);
    getStyle(key: string): Style | undefined;
    setStyle(key: string, style: Style): void;
    getIr(key: string): StyleIR | undefined;
    setIr(key: string, ir: StyleIR): void;
    getPrefixMatch(key: string): boolean | undefined;
    setPrefixMatch(key: string, value: boolean): void;
}
