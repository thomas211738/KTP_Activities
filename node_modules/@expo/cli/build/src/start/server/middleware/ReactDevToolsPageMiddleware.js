"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    ReactDevToolsEndpoint: ()=>ReactDevToolsEndpoint,
    ReactDevToolsPageMiddleware: ()=>ReactDevToolsPageMiddleware
});
function _promises() {
    const data = require("fs/promises");
    _promises = function() {
        return data;
    };
    return data;
}
function _path() {
    const data = /*#__PURE__*/ _interopRequireDefault(require("path"));
    _path = function() {
        return data;
    };
    return data;
}
function _resolveFrom() {
    const data = /*#__PURE__*/ _interopRequireDefault(require("resolve-from"));
    _resolveFrom = function() {
        return data;
    };
    return data;
}
const _expoMiddleware = require("./ExpoMiddleware");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const ReactDevToolsEndpoint = "/_expo/react-devtools";
class ReactDevToolsPageMiddleware extends _expoMiddleware.ExpoMiddleware {
    constructor(projectRoot){
        super(projectRoot, [
            ReactDevToolsEndpoint
        ]);
    }
    async handleRequestAsync(req, res) {
        var // Production: This will resolve when installed in the project.
        ref;
        const templatePath = (ref = _resolveFrom().default.silent(this.projectRoot, "expo/static/react-devtools-page/index.html")) != null ? ref : // Development: This will resolve when testing locally.
        _path().default.resolve(__dirname, "../../../../../static/react-devtools-page/index.html");
        const content = (await (0, _promises().readFile)(templatePath)).toString("utf-8");
        res.setHeader("Content-Type", "text/html");
        res.end(content);
    }
}

//# sourceMappingURL=ReactDevToolsPageMiddleware.js.map