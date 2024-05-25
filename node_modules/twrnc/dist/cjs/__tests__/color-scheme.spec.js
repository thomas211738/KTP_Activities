"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_test_renderer_1 = __importDefault(require("react-test-renderer"));
const react_native_1 = __importDefault(require("react-native"));
const globals_1 = require("@jest/globals");
const react_1 = __importDefault(require("react"));
const __1 = require("../");
jest.mock(`react-native`, () => ({
    Platform: { OS: `ios` },
    useColorScheme: () => `light`,
    useWindowDimensions: () => ({ width: 320, height: 640, fontScale: 1, scale: 2 }),
}));
const Test = ({ tw, initial, }) => {
    (0, __1.useDeviceContext)(tw, {
        observeDeviceColorSchemeChanges: false,
        initialColorScheme: initial,
    });
    const [colorScheme] = (0, __1.useAppColorScheme)(tw);
    return (react_1.default.createElement(react_1.default.Fragment, null,
        String(colorScheme),
        tw.prefixMatch(`dark`) ? `match:dark` : `no-match:dark`));
};
(0, globals_1.describe)(`useAppColorScheme()`, () => {
    (0, globals_1.it)(`should initialize to ambient color scheme, if no initializer`, () => {
        react_native_1.default.useColorScheme = () => `dark`;
        let component = react_test_renderer_1.default.create(react_1.default.createElement(Test, { tw: (0, __1.create)(), initial: "device" }));
        (0, globals_1.expect)(component.toJSON()).toEqual([`dark`, `match:dark`]);
        react_native_1.default.useColorScheme = () => `light`;
        component = react_test_renderer_1.default.create(react_1.default.createElement(Test, { tw: (0, __1.create)(), initial: "device" }));
        (0, globals_1.expect)(component.toJSON()).toEqual([`light`, `no-match:dark`]);
        react_native_1.default.useColorScheme = () => null;
        component = react_test_renderer_1.default.create(react_1.default.createElement(Test, { tw: (0, __1.create)(), initial: "device" }));
        (0, globals_1.expect)(component.toJSON()).toEqual([`null`, `no-match:dark`]);
        react_native_1.default.useColorScheme = () => undefined;
        component = react_test_renderer_1.default.create(react_1.default.createElement(Test, { tw: (0, __1.create)(), initial: "device" }));
        (0, globals_1.expect)(component.toJSON()).toEqual([`undefined`, `no-match:dark`]);
    });
    (0, globals_1.it)(`should initialize to explicitly passed color scheme when initializer provided`, () => {
        react_native_1.default.useColorScheme = () => `dark`;
        let component = react_test_renderer_1.default.create(react_1.default.createElement(Test, { tw: (0, __1.create)(), initial: "light" }));
        (0, globals_1.expect)(component.toJSON()).toEqual([`light`, `no-match:dark`]);
        react_native_1.default.useColorScheme = () => `light`;
        component = react_test_renderer_1.default.create(react_1.default.createElement(Test, { tw: (0, __1.create)(), initial: "dark" }));
        (0, globals_1.expect)(component.toJSON()).toEqual([`dark`, `match:dark`]);
    });
    test(`nested components should read same app color scheme`, () => {
        const tw = (0, __1.create)();
        const NestedComponent = () => {
            const [colorScheme] = (0, __1.useAppColorScheme)(tw);
            return (react_1.default.createElement(react_1.default.Fragment, null,
                tw.prefixMatch(`dark`) ? `nested:match:dark` : `nested:no-match:dark`,
                `nested:${colorScheme}`));
        };
        const Toggler = () => null;
        const Component = ({ initial, }) => {
            (0, __1.useDeviceContext)(tw, {
                observeDeviceColorSchemeChanges: false,
                initialColorScheme: initial,
            });
            const [colorScheme, toggleColorScheme] = (0, __1.useAppColorScheme)(tw);
            return (react_1.default.createElement(react_1.default.Fragment, null,
                react_1.default.createElement(Toggler, { onPress: () => toggleColorScheme() }),
                tw.prefixMatch(`dark`) ? `outer:match:dark` : `outer:no-match:dark`,
                `outer:${colorScheme}`,
                react_1.default.createElement(NestedComponent, null)));
        };
        const renderer = react_test_renderer_1.default.create(react_1.default.createElement(Component, { initial: "light" }));
        (0, globals_1.expect)(assertArray(renderer.toJSON())).toEqual([
            `outer:no-match:dark`,
            `outer:light`,
            `nested:no-match:dark`,
            `nested:light`,
        ]);
        react_test_renderer_1.default.act(() => {
            renderer.root.findByType(Toggler).props.onPress();
        });
        (0, globals_1.expect)(assertArray(renderer.toJSON())).toEqual([
            `outer:match:dark`,
            `outer:dark`,
            `nested:match:dark`,
            `nested:dark`,
        ]);
    });
});
function assertArray(value) {
    if (!Array.isArray(value))
        throw new Error(`expected array, got ${value}`);
    return value;
}
