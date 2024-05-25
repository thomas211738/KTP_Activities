import { Unit } from '../types';
import { parseNumericValue, complete, toStyleVal } from '../helpers';
export default function lineHeight(value, config) {
    var _a;
    const parseValue = (_a = config === null || config === void 0 ? void 0 : config[value]) !== null && _a !== void 0 ? _a : (value.startsWith(`[`) ? value.slice(1, -1) : value);
    const parsed = parseNumericValue(parseValue);
    if (!parsed) {
        return null;
    }
    const [number, unit] = parsed;
    if (unit === Unit.none) {
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
    const styleVal = toStyleVal(number, unit);
    return styleVal !== null ? complete({ lineHeight: styleVal }) : null;
}
