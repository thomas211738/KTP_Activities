"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.letterSpacing = void 0;
const types_1 = require("../types");
const helpers_1 = require("../helpers");
function letterSpacing(value, isNegative, config) {
    const configValue = config === null || config === void 0 ? void 0 : config[value];
    if (configValue) {
        const parsed = (0, helpers_1.parseNumericValue)(configValue, { isNegative });
        if (!parsed) {
            return null;
        }
        const [number, unit] = parsed;
        if (unit === types_1.Unit.em) {
            return relativeLetterSpacing(number);
        }
        // @TODO, if we get a percentage based config value, theoretically we could
        // make a font-size dependent style as well, wait for someone to raise an issue
        if (unit === types_1.Unit.percent) {
            (0, helpers_1.warn)(`percentage-based letter-spacing configuration currently unsupported, switch to \`em\`s, or open an issue if you'd like to see support added.`);
            return null;
        }
        const styleVal = (0, helpers_1.toStyleVal)(number, unit, { isNegative });
        if (styleVal !== null) {
            return (0, helpers_1.complete)({ letterSpacing: styleVal });
        }
        return null;
    }
    return (0, helpers_1.unconfiggedStyle)(`letterSpacing`, value, { isNegative });
}
exports.letterSpacing = letterSpacing;
function relativeLetterSpacing(ems) {
    return {
        kind: `dependent`,
        complete(style) {
            const fontSize = style.fontSize;
            if (typeof fontSize !== `number` || Number.isNaN(fontSize)) {
                return `tracking-X relative letter spacing classes require font-size to be set`;
            }
            style.letterSpacing = Math.round((ems * fontSize + Number.EPSILON) * 100) / 100;
        },
    };
}
