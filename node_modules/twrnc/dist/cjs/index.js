"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.style = exports.plugin = exports.create = exports.useAppColorScheme = exports.useDeviceContext = void 0;
const react_native_1 = require("react-native");
const plugin_1 = __importDefault(require("./plugin"));
exports.plugin = plugin_1.default;
const create_1 = __importDefault(require("./create"));
// Apply default config and inject RN Platform
const create = (twConfig = {}) => (0, create_1.default)(twConfig, react_native_1.Platform.OS);
exports.create = create;
var hooks_1 = require("./hooks");
Object.defineProperty(exports, "useDeviceContext", { enumerable: true, get: function () { return hooks_1.useDeviceContext; } });
Object.defineProperty(exports, "useAppColorScheme", { enumerable: true, get: function () { return hooks_1.useAppColorScheme; } });
const tailwind = create();
const style = tailwind.style;
exports.style = style;
exports.default = tailwind;
