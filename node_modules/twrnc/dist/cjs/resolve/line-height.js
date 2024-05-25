"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../types");
const helpers_1 = require("../helpers");
function lineHeight(value, config) {
    var _a;
    const parseValue = (_a = config === null || config === void 0 ? void 0 : config[value]) !== null && _a !== void 0 ? _a : (value.startsWith(`[`) ? value.slice(1, -1) : value);
    const parsed = (0, helpers_1.parseNumericValue)(parseValue);
    if (!parsed) {
        return null;
    }
    const [number, unit] = parsed;
    if (unit === types_1.Unit.none) {
        // we have a relative line-height like `2` for `leading-loose`
        return {
            kind: `dependent`,
            complete(style) {
                if (typeof style.fontSize !== `number`) {
                    return `relative line-height utilities require that font-size be set`;
                }
                style.lineHeight = style.fontSize * number;
            },
        };
    }
    const styleVal = (0, helpers_1.toStyleVal)(number, unit);
    return styleVal !== null ? (0, helpers_1.complete)({ lineHeight: styleVal }) : null;
}
exports.default = lineHeight;
