import { parseNumericValue, complete } from '../helpers';
export function opacity(value, config) {
    const configValue = config === null || config === void 0 ? void 0 : config[value];
    if (configValue) {
        const parsedConfig = parseNumericValue(String(configValue));
        if (parsedConfig) {
            return complete({ opacity: parsedConfig[0] });
        }
    }
    const parsedArbitrary = parseNumericValue(value);
    if (parsedArbitrary) {
        return complete({ opacity: parsedArbitrary[0] / 100 });
    }
    return null;
}
