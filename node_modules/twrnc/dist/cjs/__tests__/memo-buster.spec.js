"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_test_renderer_1 = __importDefault(require("react-test-renderer"));
const globals_1 = require("@jest/globals");
const react_1 = __importDefault(require("react"));
const __1 = require("../");
(0, globals_1.describe)(`memo busting`, () => {
    let tw = (0, __1.create)();
    beforeEach(() => (tw = (0, __1.create)()));
    const MemoComponent = react_1.default.memo(() => (react_1.default.createElement(react_1.default.Fragment, null, tw.prefixMatch(`dark`) ? `memo:match:dark` : `memo:no-match:dark`)));
    const Toggler = () => null;
    const Component = ({ initial }) => {
        (0, __1.useDeviceContext)(tw, {
            observeDeviceColorSchemeChanges: false,
            initialColorScheme: initial,
        });
        const [, toggleColorScheme] = (0, __1.useAppColorScheme)(tw);
        return (react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement(Toggler, { onPress: () => toggleColorScheme() }),
            tw.prefixMatch(`dark`) ? `match:dark` : `no-match:dark`,
            react_1.default.createElement(MemoComponent, { key: "stable" }),
            react_1.default.createElement(MemoComponent, { key: tw.memoBuster })));
    };
    (0, globals_1.it)(`breaks memoization properly, starting "light"`, () => {
        const renderer = react_test_renderer_1.default.create(react_1.default.createElement(Component, { initial: "light" }));
        (0, globals_1.expect)(assertArray(renderer.toJSON())).toEqual([
            `no-match:dark`,
            `memo:no-match:dark`,
            `memo:no-match:dark`,
        ]);
        react_test_renderer_1.default.act(() => {
            renderer.root.findByType(Toggler).props.onPress();
        });
        (0, globals_1.expect)(assertArray(renderer.toJSON())).toEqual([
            `match:dark`,
            `memo:no-match:dark`, // <-- memo not busted
            `memo:match:dark`, // <-- memo busted
        ]);
    });
    (0, globals_1.it)(`breaks memoization properly, starting "dark"`, () => {
        const renderer = react_test_renderer_1.default.create(react_1.default.createElement(Component, { initial: "dark" }));
        (0, globals_1.expect)(assertArray(renderer.toJSON())).toEqual([
            `match:dark`,
            `memo:match:dark`,
            `memo:match:dark`,
        ]);
        react_test_renderer_1.default.act(() => {
            renderer.root.findByType(Toggler).props.onPress();
        });
        (0, globals_1.expect)(assertArray(renderer.toJSON())).toEqual([
            `no-match:dark`,
            `memo:match:dark`, // <-- memo not busted
            `memo:no-match:dark`, // <-- memo busted
        ]);
    });
});
function assertArray(value) {
    if (!Array.isArray(value))
        throw new Error(`expected array, got ${value}`);
    return value;
}
