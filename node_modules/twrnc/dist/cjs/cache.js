"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const styles_1 = __importDefault(require("./styles"));
class Cache {
    constructor(customStyles) {
        this.ir = new Map(styles_1.default);
        this.styles = new Map();
        this.prefixes = new Map();
        this.ir = new Map([...styles_1.default, ...(customStyles !== null && customStyles !== void 0 ? customStyles : [])]);
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
exports.default = Cache;
