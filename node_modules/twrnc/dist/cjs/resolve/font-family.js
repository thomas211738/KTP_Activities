"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("../helpers");
function fontFamily(value, config) {
    const configValue = config === null || config === void 0 ? void 0 : config[value];
    if (!configValue) {
        return null;
    }
    if (typeof configValue === `string`) {
        return (0, helpers_1.complete)({ fontFamily: configValue });
    }
    const firstFamily = configValue[0];
    if (!firstFamily) {
        return null;
    }
    return (0, helpers_1.complete)({ fontFamily: firstFamily });
}
exports.default = fontFamily;
