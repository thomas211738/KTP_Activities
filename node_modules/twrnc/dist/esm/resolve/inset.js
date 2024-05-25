import { complete, parseStyleVal, parseUnconfigged } from '../helpers';
export function inset(type, value, isNegative, config) {
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
        const styleVal = parseStyleVal(configValue, { isNegative });
        if (styleVal !== null) {
            return insetStyle(type, insetDir, styleVal);
        }
    }
    const unconfigged = parseUnconfigged(value, { isNegative });
    if (unconfigged !== null) {
        return insetStyle(type, insetDir, unconfigged);
    }
    return null;
}
function insetStyle(type, dir, styleVal) {
    if (type !== `inset`) {
        return complete({ [type]: styleVal });
    }
    switch (dir) {
        case null:
            return complete({
                top: styleVal,
                left: styleVal,
                right: styleVal,
                bottom: styleVal,
            });
        case `y`:
            return complete({
                top: styleVal,
                bottom: styleVal,
            });
        case `x`:
            return complete({
                left: styleVal,
                right: styleVal,
            });
    }
}
