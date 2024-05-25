import { complete } from '../helpers';
export default function fontFamily(value, config) {
    const configValue = config === null || config === void 0 ? void 0 : config[value];
    if (!configValue) {
        return null;
    }
    if (typeof configValue === `string`) {
        return complete({ fontFamily: configValue });
    }
    const firstFamily = configValue[0];
    if (!firstFamily) {
        return null;
    }
    return complete({ fontFamily: firstFamily });
}
