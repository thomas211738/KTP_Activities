"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseInputs = void 0;
function parseInputs(inputs) {
    let classNames = [];
    let styles = null;
    inputs.forEach((input) => {
        if (typeof input === `string`) {
            classNames = [...classNames, ...split(input)];
        }
        else if (Array.isArray(input)) {
            classNames = [...classNames, ...input.flatMap(split)];
        }
        else if (typeof input === `object` && input !== null) {
            for (const [key, value] of Object.entries(input)) {
                if (typeof value === `boolean`) {
                    classNames = [...classNames, ...(value ? split(key) : [])];
                }
                else if (styles) {
                    styles[key] = value;
                }
                else {
                    styles = { [key]: value };
                }
            }
        }
    });
    return [classNames.filter(Boolean).filter(unique), styles];
}
exports.parseInputs = parseInputs;
function split(str) {
    return str.trim().split(/\s+/);
}
function unique(className, index, classes) {
    return classes.lastIndexOf(className) === index;
}
