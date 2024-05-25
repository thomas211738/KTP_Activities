"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shadowOffset = exports.shadowOpacity = void 0;
const helpers_1 = require("../helpers");
function shadowOpacity(value) {
    const percentage = parseInt(value, 10);
    if (Number.isNaN(percentage)) {
        return null;
    }
    return {
        kind: `complete`,
        style: { shadowOpacity: percentage / 100 },
    };
}
exports.shadowOpacity = shadowOpacity;
function shadowOffset(value) {
    if (value.includes(`/`)) {
        const [widthStr = ``, heightStr = ``] = value.split(`/`, 2);
        const width = offsetValue(widthStr);
        const height = offsetValue(heightStr);
        if (width === null || height === null) {
            return null;
        }
        return {
            kind: `complete`,
            style: {
                shadowOffset: {
                    width,
                    height,
                },
            },
        };
    }
    const number = offsetValue(value);
    if (number === null) {
        return null;
    }
    return {
        kind: `complete`,
        style: {
            shadowOffset: {
                width: number,
                height: number,
            },
        },
    };
}
exports.shadowOffset = shadowOffset;
function offsetValue(value) {
    const parsed = (0, helpers_1.parseUnconfigged)(value);
    return typeof parsed === `number` ? parsed : null;
}
