"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAppColorScheme = exports.useDeviceContext = void 0;
const react_1 = require("react");
const react_native_1 = require("react-native");
function useDeviceContext(tw, appOptions) {
    const deviceColorScheme = (0, react_native_1.useColorScheme)();
    (0, react_1.useState)(() => {
        // (mis?)use `useState` initializer fn to initialize appColorScheme only ONCE
        if (appOptions) {
            const initial = appOptions.initialColorScheme;
            tw.setColorScheme(initial === `device` ? deviceColorScheme : initial);
            if (`withDeviceColorScheme` in appOptions) {
                console.error(MIGRATION_ERR); // eslint-disable-line no-console
            }
        }
    });
    const window = (0, react_native_1.useWindowDimensions)();
    tw.updateDeviceContext(window, window.fontScale, window.scale === 1 ? 1 : 2, appOptions ? `skip` : deviceColorScheme);
}
exports.useDeviceContext = useDeviceContext;
function useAppColorScheme(tw) {
    const [helper, setHelper] = (0, react_1.useState)(0);
    return [
        tw.getColorScheme(),
        () => {
            tw.setColorScheme(tw.getColorScheme() === `dark` ? `light` : `dark`);
            setHelper(helper + 1);
        },
        (newColorScheme) => {
            tw.setColorScheme(newColorScheme);
            setHelper(helper + 1);
        },
    ];
}
exports.useAppColorScheme = useAppColorScheme;
const MIGRATION_ERR = `\`withDeviceColorScheme\` has been changed to \`observeDeviceColorSchemeChanges\` in twrnc@4.0.0 -- see migration-guide.md for more details`;
