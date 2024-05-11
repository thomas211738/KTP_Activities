/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ "use strict";
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
    createMetroEndpointAsync: ()=>createMetroEndpointAsync,
    requireFileContentsWithMetro: ()=>requireFileContentsWithMetro,
    getStaticRenderFunctionsForEntry: ()=>getStaticRenderFunctionsForEntry,
    evalMetro: ()=>evalMetro,
    evalMetroNoHandling: ()=>evalMetroNoHandling
});
function _fs() {
    const data = /*#__PURE__*/ _interopRequireDefault(require("fs"));
    _fs = function() {
        return data;
    };
    return data;
}
function _nodeFetch() {
    const data = /*#__PURE__*/ _interopRequireDefault(require("node-fetch"));
    _nodeFetch = function() {
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
function _requireFromString() {
    const data = /*#__PURE__*/ _interopRequireDefault(require("require-from-string"));
    _requireFromString = function() {
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
const _metroErrorInterface = require("./metro/metroErrorInterface");
const _manifestMiddleware = require("./middleware/ManifestMiddleware");
const _metroOptions = require("./middleware/metroOptions");
const _serverLogLikeMetro = require("./serverLogLikeMetro");
const _ansi = require("../../utils/ansi");
const _delay = require("../../utils/delay");
const _errors = require("../../utils/errors");
const _fn = require("../../utils/fn");
const _profile = require("../../utils/profile");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
class MetroNodeError extends Error {
    constructor(message, rawObject){
        super(message);
        this.rawObject = rawObject;
    }
}
const debug = require("debug")("expo:start:server:node-renderer");
const cachedSourceMaps = new Map();
// Support unhandled rejections
// Detect if running in Bun
// @ts-expect-error: This is a global variable that is set by Bun.
if (!process.isBun) {
    require("source-map-support").install({
        retrieveSourceMap (source) {
            if (cachedSourceMaps.has(source)) {
                return cachedSourceMaps.get(source);
            }
            return null;
        }
    });
}
function wrapBundle(str) {
    // Skip the metro runtime so debugging is a bit easier.
    // Replace the __r() call with an export statement.
    // Use gm to apply to the last require line. This is needed when the bundle has side-effects.
    return str.replace(/^(__r\(.*\);)$/gm, "module.exports = $1");
}
// TODO(EvanBacon): Group all the code together and version.
const getRenderModuleId = (projectRoot, entry = "expo-router/node/render.js")=>{
    const moduleId = _resolveFrom().default.silent(projectRoot, entry);
    if (!moduleId) {
        throw new Error(`A version of expo-router with Node.js support is not installed in the project.`);
    }
    return moduleId;
};
const moveStaticRenderFunction = (0, _fn.memoize)(async (projectRoot, requiredModuleId)=>{
    // Copy the file into the project to ensure it works in monorepos.
    // This means the file cannot have any relative imports.
    const tempDir = _path().default.join(projectRoot, ".expo/static");
    await _fs().default.promises.mkdir(tempDir, {
        recursive: true
    });
    const moduleId = _path().default.join(tempDir, "render.js");
    await _fs().default.promises.writeFile(moduleId, await _fs().default.promises.readFile(requiredModuleId, "utf8"));
    // Sleep to give watchman time to register the file.
    await (0, _delay.delayAsync)(50);
    return moduleId;
});
/** @returns the js file contents required to generate the static generation function. */ async function getStaticRenderFunctionsContentAsync(projectRoot, devServerUrl, props, entry) {
    const root = (0, _manifestMiddleware.getMetroServerRoot)(projectRoot);
    const requiredModuleId = getRenderModuleId(root, entry);
    let moduleId = requiredModuleId;
    // Cannot be accessed using Metro's server API, we need to move the file
    // into the project root and try again.
    if (_path().default.relative(root, moduleId).startsWith("..")) {
        moduleId = await moveStaticRenderFunction(projectRoot, requiredModuleId);
    }
    return requireFileContentsWithMetro(root, devServerUrl, moduleId, props);
}
async function ensureFileInRootDirectory(projectRoot, otherFile) {
    // Cannot be accessed using Metro's server API, we need to move the file
    // into the project root and try again.
    if (!_path().default.relative(projectRoot, otherFile).startsWith(".." + _path().default.sep)) {
        return otherFile;
    }
    // Copy the file into the project to ensure it works in monorepos.
    // This means the file cannot have any relative imports.
    const tempDir = _path().default.join(projectRoot, ".expo/static-tmp");
    await _fs().default.promises.mkdir(tempDir, {
        recursive: true
    });
    const moduleId = _path().default.join(tempDir, _path().default.basename(otherFile));
    await _fs().default.promises.writeFile(moduleId, await _fs().default.promises.readFile(otherFile, "utf8"));
    // Sleep to give watchman time to register the file.
    await (0, _delay.delayAsync)(50);
    return moduleId;
}
async function createMetroEndpointAsync(projectRoot, devServerUrl, absoluteFilePath, props) {
    const root = (0, _manifestMiddleware.getMetroServerRoot)(projectRoot);
    const safeOtherFile = await ensureFileInRootDirectory(projectRoot, absoluteFilePath);
    const serverPath = _path().default.relative(root, safeOtherFile).replace(/\.[jt]sx?$/, "");
    const urlFragment = (0, _metroOptions.createBundleUrlPath)({
        mainModuleName: serverPath,
        lazy: false,
        asyncRoutes: false,
        inlineSourceMap: false,
        engine: "hermes",
        minify: false,
        bytecode: false,
        ...props
    });
    let url;
    if (devServerUrl) {
        url = new URL(urlFragment.replace(/^\//, ""), devServerUrl).toString();
    } else {
        url = "/" + urlFragment.replace(/^\/+/, "");
    }
    return url;
}
async function requireFileContentsWithMetro(projectRoot, devServerUrl, absoluteFilePath, props) {
    const url = await createMetroEndpointAsync(projectRoot, devServerUrl, absoluteFilePath, props);
    return await metroFetchAsync(projectRoot, url);
}
async function metroFetchAsync(projectRoot, url) {
    debug("Fetching from Metro:", url);
    // TODO: Skip the dev server and use the Metro instance directly for better results, faster.
    const res = await (0, _nodeFetch().default)(url);
    // TODO: Improve error handling
    if (res.status === 500) {
        const text = await res.text();
        if (text.startsWith('{"originModulePath"') || text.startsWith('{"type":"TransformError"') || text.startsWith('{"type":"InternalError"')) {
            const errorObject = JSON.parse(text);
            var ref;
            throw new MetroNodeError((ref = (0, _ansi.stripAnsi)(errorObject.message)) != null ? ref : errorObject.message, errorObject);
        }
        throw new Error(`[${res.status}]: ${res.statusText}\n${text}`);
    }
    if (!res.ok) {
        throw new Error(`Error fetching bundle for static rendering: ${res.status} ${res.statusText}`);
    }
    const content = await res.text();
    const map = await (0, _nodeFetch().default)(url.replace(".bundle?", ".map?")).then((r)=>r.json());
    cachedSourceMaps.set(url, {
        url: projectRoot,
        map
    });
    return {
        src: wrapBundle(content),
        filename: url,
        map
    };
}
async function getStaticRenderFunctionsForEntry(projectRoot, devServerUrl, options, entry) {
    const { src: scriptContents , filename  } = await getStaticRenderFunctionsContentAsync(projectRoot, devServerUrl, options, entry);
    return {
        filename,
        fn: await evalMetroAndWrapFunctions(projectRoot, scriptContents, filename)
    };
}
function evalMetroAndWrapFunctions(projectRoot, script, filename) {
    const contents = evalMetro(projectRoot, script, filename);
    // wrap each function with a try/catch that uses Metro's error formatter
    return Object.keys(contents).reduce((acc, key)=>{
        const fn = contents[key];
        if (typeof fn !== "function") {
            return {
                ...acc,
                [key]: fn
            };
        }
        acc[key] = async function(...props) {
            try {
                return await fn.apply(this, props);
            } catch (error) {
                await (0, _metroErrorInterface.logMetroError)(projectRoot, {
                    error
                });
                throw new _errors.SilentError(error);
            }
        };
        return acc;
    }, {});
}
function evalMetro(projectRoot, src, filename) {
    try {
        return evalMetroNoHandling(projectRoot, src, filename);
    } catch (error) {
        // Format any errors that were thrown in the global scope of the evaluation.
        if (error instanceof Error) {
            (0, _metroErrorInterface.logMetroErrorAsync)({
                projectRoot,
                error
            }).catch((internalError)=>{
                debug("Failed to log metro error:", internalError);
                throw error;
            });
        } else {
            throw error;
        }
    }
}
function evalMetroNoHandling(projectRoot, src, filename) {
    (0, _serverLogLikeMetro.augmentLogs)(projectRoot);
    return (0, _profile.profile)(_requireFromString().default, "eval-metro-bundle")(src, filename);
}

//# sourceMappingURL=getStaticRenderFunctions.js.map