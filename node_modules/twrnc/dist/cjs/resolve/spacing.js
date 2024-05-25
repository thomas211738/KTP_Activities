"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../types");
const helpers_1 = require("../helpers");
function spacing(type, direction, value, context, config) {
    let numericValue = ``;
    if (value[0] === `[`) {
        numericValue = value.slice(1, -1);
    }
    else {
        const configValue = config === null || config === void 0 ? void 0 : config[value];
        if (!configValue) {
            const unconfigged = (0, helpers_1.parseUnconfigged)(value);
            if (unconfigged && typeof unconfigged === `number`) {
                return spacingStyle(unconfigged, types_1.Unit.px, direction, type, context);
            }
            return null;
        }
        else {
            numericValue = configValue;
        }
    }
    if (numericValue === `auto`) {
        return expand(direction, type, `auto`);
    }
    const parsed = (0, helpers_1.parseNumericValue)(numericValue);
    if (!parsed) {
        return null;
    }
    const [number, unit] = parsed;
    return spacingStyle(number, unit, direction, type, context);
}
exports.default = spacing;
function spacingStyle(number, unit, direction, type, context) {
    const pixels = (0, helpers_1.toStyleVal)(number, unit, context);
    if (pixels === null) {
        return null;
    }
    return expand(direction, type, pixels);
}
function expand(direction, type, value) {
    switch (direction) {
        case `All`:
            return {
                kind: `complete`,
                style: {
                    [`${type}Top`]: value,
                    [`${type}Right`]: value,
                    [`${type}Bottom`]: value,
                    [`${type}Left`]: value,
                },
            };
        case `Bottom`:
        case `Top`:
        case `Left`:
        case `Right`:
            return {
                kind: `complete`,
                style: {
                    [`${type}${direction}`]: value,
                },
            };
        case `Vertical`:
            return {
                kind: `complete`,
                style: {
                    [`${type}Top`]: value,
                    [`${type}Bottom`]: value,
                },
            };
        case `Horizontal`:
            return {
                kind: `complete`,
                style: {
                    [`${type}Left`]: value,
                    [`${type}Right`]: value,
                },
            };
        default:
            return null;
    }
}
