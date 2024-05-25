import defaultStyles from './styles';
export default class Cache {
    constructor(customStyles) {
        this.ir = new Map(defaultStyles);
        this.styles = new Map();
        this.prefixes = new Map();
        this.ir = new Map([...defaultStyles, ...(customStyles !== null && customStyles !== void 0 ? customStyles : [])]);
    }
    getStyle(key) {
        return this.styles.get(key);
    }
    setStyle(key, style) {
        this.styles.set(key, style);
    }
    getIr(key) {
        return this.ir.get(key);
    }
    setIr(key, ir) {
        this.ir.set(key, ir);
    }
    getPrefixMatch(key) {
        return this.prefixes.get(key);
    }
    setPrefixMatch(key, value) {
        this.prefixes.set(key, value);
    }
}
