"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.opacity = void 0;
const helpers_1 = require("../helpers");
function opacity(value, config) {
    const configValue = config === null || config === void 0 ? void 0 : config[value];
    if (configValue) {
        const parsedConfig = (0, helpers_1.parseNumericValue)(String(configValue));
        if (parsedConfig) {
            return (0, helpers_1.complete)({ opacity: parsedConfig[0] });
        }
    }
    const parsedArbitrary = (0, helpers_1.parseNumericValue)(value);
    if (parsedArbitrary) {
        return (0, helpers_1.complete)({ opacity: parsedArbitrary[0] / 100 });
    }
    return null;
}
exports.opacity = opacity;
