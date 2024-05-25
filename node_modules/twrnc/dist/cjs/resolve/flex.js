"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gap = exports.flexBasis = exports.flex = exports.flexGrowShrink = void 0;
const helpers_1 = require("../helpers");
function flexGrowShrink(type, value, config) {
    var _a;
    value = value.replace(/^-/, ``);
    if (value[0] === `[` && value.endsWith(`]`)) {
        value = value.slice(1, -1);
    }
    const configKey = value === `` ? `DEFAULT` : value;
    const numericValue = Number((_a = config === null || config === void 0 ? void 0 : config[configKey]) !== null && _a !== void 0 ? _a : value);
    if (!Number.isNaN(numericValue)) {
        return (0, helpers_1.complete)({ [`flex${type}`]: numericValue });
    }
    return null;
}
exports.flexGrowShrink = flexGrowShrink;
function flex(value, config) {
    var _a, _b;
    value = (config === null || config === void 0 ? void 0 : config[value]) || value;
    if ([`min-content`, `revert`, `unset`].includes(value)) {
        // unsupported
        return null;
    }
    // @see https://developer.mozilla.org/en-US/docs/Web/CSS/flex
    // MDN: One value, unitless number: flex-grow flex-basis is then equal to 0.
    if (value.match(/^\d+(\.\d+)?$/)) {
        return (0, helpers_1.complete)({
            flexGrow: Number(value),
            flexBasis: `0%`,
        });
    }
    // MDN: Two values (both integers): flex-grow | flex-basis
    let match = value.match(/^(\d+)\s+(\d+)$/);
    if (match) {
        return (0, helpers_1.complete)({
            flexGrow: Number(match[1]),
            flexShrink: Number(match[2]),
        });
    }
    // MDN: Two values: flex-grow | flex-basis
    match = value.match(/^(\d+)\s+([^ ]+)$/);
    if (match) {
        const flexBasis = (0, helpers_1.parseStyleVal)((_a = match[2]) !== null && _a !== void 0 ? _a : ``);
        if (!flexBasis) {
            return null;
        }
        return (0, helpers_1.complete)({
            flexGrow: Number(match[1]),
            flexBasis,
        });
    }
    // MDN: Three values: flex-grow | flex-shrink | flex-basis
    match = value.match(/^(\d+)\s+(\d+)\s+(.+)$/);
    if (match) {
        const flexBasis = (0, helpers_1.parseStyleVal)((_b = match[3]) !== null && _b !== void 0 ? _b : ``);
        if (!flexBasis) {
            return null;
        }
        return (0, helpers_1.complete)({
            flexGrow: Number(match[1]),
            flexShrink: Number(match[2]),
            flexBasis,
        });
    }
    return null;
}
exports.flex = flex;
function flexBasis(value, context = {}, config) {
    value = value.replace(/^-/, ``);
    const configValue = config === null || config === void 0 ? void 0 : config[value];
    if (configValue !== undefined) {
        return (0, helpers_1.getCompleteStyle)(`flexBasis`, configValue, context);
    }
    return (0, helpers_1.unconfiggedStyle)(`flexBasis`, value, context);
}
exports.flexBasis = flexBasis;
function gap(value, context = {}, config) {
    let gapStyle = `gap`;
    value = value.replace(/^-(x|y)-/, (_, dir) => {
        if (dir === `x`) {
            gapStyle = `columnGap`;
        }
        if (dir === `y`) {
            gapStyle = `rowGap`;
        }
        return ``;
    });
    value = value.replace(/^-/, ``);
    const configValue = config === null || config === void 0 ? void 0 : config[value];
    if (configValue !== undefined) {
        return (0, helpers_1.getCompleteStyle)(gapStyle, configValue, context);
    }
    return (0, helpers_1.unconfiggedStyle)(gapStyle, value, context);
}
exports.gap = gap;
