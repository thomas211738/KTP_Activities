"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inset = void 0;
const helpers_1 = require("../helpers");
function inset(type, value, isNegative, config) {
    let insetDir = null;
    if (type === `inset`) {
        value = value.replace(/^(x|y)-/, (_, dir) => {
            insetDir = dir === `x` ? `x` : `y`;
            return ``;
        });
    }
    if (value === `auto`) {
        return insetStyle(type, insetDir, value);
    }
    const configValue = config === null || config === void 0 ? void 0 : config[value];
    if (configValue) {
        const styleVal = (0, helpers_1.parseStyleVal)(configValue, { isNegative });
        if (styleVal !== null) {
            return insetStyle(type, insetDir, styleVal);
        }
    }
    const unconfigged = (0, helpers_1.parseUnconfigged)(value, { isNegative });
    if (unconfigged !== null) {
        return insetStyle(type, insetDir, unconfigged);
    }
    return null;
}
exports.inset = inset;
function insetStyle(type, dir, styleVal) {
    if (type !== `inset`) {
        return (0, helpers_1.complete)({ [type]: styleVal });
    }
    switch (dir) {
        case null:
            return (0, helpers_1.complete)({
                top: styleVal,
                left: styleVal,
                right: styleVal,
                bottom: styleVal,
            });
        case `y`:
            return (0, helpers_1.complete)({
                top: styleVal,
                bottom: styleVal,
            });
        case `x`:
            return (0, helpers_1.complete)({
                left: styleVal,
                right: styleVal,
            });
    }
}
