import TestRenderer from 'react-test-renderer';
import { describe, it, expect } from '@jest/globals';
import React from 'react';
import { create, useDeviceContext, useAppColorScheme } from '../';
describe(`memo busting`, () => {
    let tw = create();
    beforeEach(() => (tw = create()));
    const MemoComponent = React.memo(() => (React.createElement(React.Fragment, null, tw.prefixMatch(`dark`) ? `memo:match:dark` : `memo:no-match:dark`)));
    const Toggler = () => null;
    const Component = ({ initial }) => {
        useDeviceContext(tw, {
            observeDeviceColorSchemeChanges: false,
            initialColorScheme: initial,
        });
        const [, toggleColorScheme] = useAppColorScheme(tw);
        return (React.createElement(React.Fragment, null,
            React.createElement(Toggler, { onPress: () => toggleColorScheme() }),
            tw.prefixMatch(`dark`) ? `match:dark` : `no-match:dark`,
            React.createElement(MemoComponent, { key: "stable" }),
            React.createElement(MemoComponent, { key: tw.memoBuster })));
    };
    it(`breaks memoization properly, starting "light"`, () => {
        const renderer = TestRenderer.create(React.createElement(Component, { initial: "light" }));
        expect(assertArray(renderer.toJSON())).toEqual([
            `no-match:dark`,
            `memo:no-match:dark`,
            `memo:no-match:dark`,
        ]);
        TestRenderer.act(() => {
            renderer.root.findByType(Toggler).props.onPress();
        });
        expect(assertArray(renderer.toJSON())).toEqual([
            `match:dark`,
            `memo:no-match:dark`, // <-- memo not busted
            `memo:match:dark`, // <-- memo busted
        ]);
    });
    it(`breaks memoization properly, starting "dark"`, () => {
        const renderer = TestRenderer.create(React.createElement(Component, { initial: "dark" }));
        expect(assertArray(renderer.toJSON())).toEqual([
            `match:dark`,
            `memo:match:dark`,
            `memo:match:dark`,
        ]);
        TestRenderer.act(() => {
            renderer.root.findByType(Toggler).props.onPress();
        });
        expect(assertArray(renderer.toJSON())).toEqual([
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
