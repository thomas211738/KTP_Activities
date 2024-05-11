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
    ForwardHtmlError: ()=>ForwardHtmlError,
    MetroBundlerDevServer: ()=>MetroBundlerDevServer,
    getDeepLinkHandler: ()=>getDeepLinkHandler
});
function _config() {
    const data = require("@expo/config");
    _config = function() {
        return data;
    };
    return data;
}
function _env() {
    const data = /*#__PURE__*/ _interopRequireWildcard(require("@expo/env"));
    _env = function() {
        return data;
    };
    return data;
}
function _assert() {
    const data = /*#__PURE__*/ _interopRequireDefault(require("assert"));
    _assert = function() {
        return data;
    };
    return data;
}
function _chalk() {
    const data = /*#__PURE__*/ _interopRequireDefault(require("chalk"));
    _chalk = function() {
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
const _createServerRouteMiddleware = require("./createServerRouteMiddleware");
const _fetchRouterManifest = require("./fetchRouterManifest");
const _instantiateMetro = require("./instantiateMetro");
const _metroErrorInterface = require("./metroErrorInterface");
const _metroWatchTypeScriptFiles = require("./metroWatchTypeScriptFiles");
const _router = require("./router");
const _serializeHtml = require("./serializeHtml");
const _waitForMetroToObserveTypeScriptFile = require("./waitForMetroToObserveTypeScriptFile");
const _log = require("../../../log");
const _getDevClientProperties = /*#__PURE__*/ _interopRequireDefault(require("../../../utils/analytics/getDevClientProperties"));
const _env1 = require("../../../utils/env");
const _errors = require("../../../utils/errors");
const _port = require("../../../utils/port");
const _telemetry = require("../../../utils/telemetry");
const _bundlerDevServer = require("../BundlerDevServer");
const _getStaticRenderFunctions = require("../getStaticRenderFunctions");
const _contextModuleSourceMapsMiddleware = require("../middleware/ContextModuleSourceMapsMiddleware");
const _createFileMiddleware = require("../middleware/CreateFileMiddleware");
const _devToolsPluginMiddleware = require("../middleware/DevToolsPluginMiddleware");
const _faviconMiddleware = require("../middleware/FaviconMiddleware");
const _historyFallbackMiddleware = require("../middleware/HistoryFallbackMiddleware");
const _interstitialPageMiddleware = require("../middleware/InterstitialPageMiddleware");
const _manifestMiddleware = require("../middleware/ManifestMiddleware");
const _reactDevToolsPageMiddleware = require("../middleware/ReactDevToolsPageMiddleware");
const _runtimeRedirectMiddleware = require("../middleware/RuntimeRedirectMiddleware");
const _serveStaticMiddleware = require("../middleware/ServeStaticMiddleware");
const _metroOptions = require("../middleware/metroOptions");
const _mutations = require("../middleware/mutations");
const _startTypescriptTypeGeneration = require("../type-generation/startTypescriptTypeGeneration");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interopRequireWildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {};
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
class ForwardHtmlError extends _errors.CommandError {
    constructor(message, html, statusCode){
        super(message);
        this.html = html;
        this.statusCode = statusCode;
    }
}
const debug = require("debug")("expo:start:server:metro");
/** Default port to use for apps running in Expo Go. */ const EXPO_GO_METRO_PORT = 8081;
/** Default port to use for apps that run in standard React Native projects or Expo Dev Clients. */ const DEV_CLIENT_METRO_PORT = 8081;
class MetroBundlerDevServer extends _bundlerDevServer.BundlerDevServer {
    metro = null;
    get name() {
        return "metro";
    }
    async resolvePortAsync(options = {}) {
        var // If the manually defined port is busy then an error should be thrown...
        _port1;
        const port = (_port1 = options.port) != null ? _port1 : // Otherwise use the default port based on the runtime target.
        (options.devClient ? Number(process.env.RCT_METRO_PORT) || DEV_CLIENT_METRO_PORT : await (0, _port.getFreePortAsync)(EXPO_GO_METRO_PORT));
        return port;
    }
    async exportExpoRouterApiRoutesAsync({ includeSourceMaps , outputDir , prerenderManifest  }) {
        const { routerRoot  } = this.instanceMetroOptions;
        (0, _assert().default)(routerRoot != null, "The server must be started before calling exportExpoRouterApiRoutesAsync.");
        const appDir = _path().default.join(this.projectRoot, routerRoot);
        const manifest = await this.getExpoRouterRoutesManifestAsync({
            appDir
        });
        const files = new Map();
        for (const route of manifest.apiRoutes){
            const filepath = _path().default.join(appDir, route.file);
            const contents = await this.bundleApiRoute(filepath);
            const artifactFilename = _path().default.join(outputDir, _path().default.relative(appDir, filepath.replace(/\.[tj]sx?$/, ".js")));
            if (contents) {
                let src = contents.src;
                if (includeSourceMaps && contents.map) {
                    // TODO(kitten): Merge the source map transformer in the future
                    // https://github.com/expo/expo/blob/0dffdb15/packages/%40expo/metro-config/src/serializer/serializeChunks.ts#L422-L439
                    // Alternatively, check whether `sourcesRoot` helps here
                    const artifactBasename = encodeURIComponent(_path().default.basename(artifactFilename) + ".map");
                    src = src.replace(/\/\/# sourceMappingURL=.*/g, `//# sourceMappingURL=${artifactBasename}`);
                    files.set(artifactFilename + ".map", {
                        contents: JSON.stringify({
                            version: contents.map.version,
                            sources: contents.map.sources.map((source)=>{
                                source = typeof source === "string" && source.startsWith(this.projectRoot) ? _path().default.relative(this.projectRoot, source) : source;
                                return source.split(_path().default.sep).join("/");
                            }),
                            sourcesContent: new Array(contents.map.sources.length).fill(null),
                            names: contents.map.names,
                            mappings: contents.map.mappings
                        }),
                        targetDomain: "server"
                    });
                }
                files.set(artifactFilename, {
                    contents: src,
                    targetDomain: "server"
                });
            }
            // Remap the manifest files to represent the output files.
            route.file = artifactFilename;
        }
        return {
            manifest: {
                ...manifest,
                htmlRoutes: prerenderManifest.htmlRoutes
            },
            files
        };
    }
    async getExpoRouterRoutesManifestAsync({ appDir  }) {
        var ref, ref1;
        // getBuiltTimeServerManifest
        const { exp  } = (0, _config().getConfig)(this.projectRoot);
        const manifest = await (0, _fetchRouterManifest.fetchManifest)(this.projectRoot, {
            ...(ref = exp.extra) == null ? void 0 : (ref1 = ref.router) == null ? void 0 : ref1.platformRoutes,
            asJson: true,
            appDir
        });
        if (!manifest) {
            throw new _errors.CommandError("EXPO_ROUTER_SERVER_MANIFEST", "Unexpected error: server manifest could not be fetched.");
        }
        return manifest;
    }
    async getStaticRenderFunctionAsync() {
        var ref;
        const { mode , minify , isExporting  } = this.instanceMetroOptions;
        (0, _assert().default)(mode != null && isExporting != null, "The server must be started before calling ssrLoadModule.");
        const url = this.getDevServerUrl();
        const { getStaticContent , getManifest , getBuildTimeServerManifestAsync  } = await this.ssrLoadModule("expo-router/node/render.js", {
            minify,
            mode,
            isExporting
        });
        const { exp  } = (0, _config().getConfig)(this.projectRoot);
        return {
            serverManifest: await getBuildTimeServerManifestAsync(),
            // Get routes from Expo Router.
            manifest: await getManifest({
                preserveApiRoutes: false,
                ...(ref = exp.extra) == null ? void 0 : ref.router
            }),
            // Get route generating function
            async renderAsync (path) {
                return await getStaticContent(new URL(path, url));
            }
        };
    }
    async getStaticResourcesAsync({ includeSourceMaps , mainModuleName  } = {}) {
        var ref;
        const { mode , minify , isExporting , baseUrl , routerRoot , asyncRoutes  } = this.instanceMetroOptions;
        (0, _assert().default)(mode != null && isExporting != null && baseUrl != null && routerRoot != null && asyncRoutes != null, "The server must be started before calling getStaticPageAsync.");
        const platform = "web";
        const devBundleUrlPathname = (0, _metroOptions.createBundleUrlPath)({
            splitChunks: isExporting && !_env1.env.EXPO_NO_BUNDLE_SPLITTING,
            platform,
            mode,
            minify,
            environment: "client",
            serializerOutput: "static",
            serializerIncludeMaps: includeSourceMaps,
            mainModuleName: mainModuleName != null ? mainModuleName : (0, _manifestMiddleware.resolveMainModuleName)(this.projectRoot, {
                platform
            }),
            lazy: (0, _metroOptions.shouldEnableAsyncImports)(this.projectRoot),
            asyncRoutes,
            baseUrl,
            isExporting,
            routerRoot,
            bytecode: false
        });
        const bundleUrl = new URL(devBundleUrlPathname, this.getDevServerUrl());
        // Fetch the generated HTML from our custom Metro serializer
        const results = await (0, _nodeFetch().default)(bundleUrl.toString());
        const txt = await results.text();
        let data;
        try {
            data = JSON.parse(txt);
        } catch (error) {
            debug(txt);
            // Metro can throw this error when the initial module id cannot be resolved.
            if (!results.ok && txt.startsWith("<!DOCTYPE html>")) {
                throw new ForwardHtmlError(`Metro failed to bundle the project. Check the console for more information.`, txt, results.status);
            }
            _log.Log.error("Failed to generate resources with Metro, the Metro config may not be using the correct serializer. Ensure the metro.config.js is extending the expo/metro-config and is not overriding the serializer.");
            throw error;
        }
        // NOTE: This could potentially need more validation in the future.
        if ("artifacts" in data && Array.isArray(data.artifacts)) {
            return data;
        }
        if (data != null && (data.errors || ((ref = data.type) == null ? void 0 : ref.match(/.*Error$/)))) {
            // {
            //   type: 'InternalError',
            //   errors: [],
            //   message: 'Metro has encountered an error: While trying to resolve module `stylis` from file `/Users/evanbacon/Documents/GitHub/lab/emotion-error-test/node_modules/@emotion/cache/dist/emotion-cache.browser.esm.js`, the package `/Users/evanbacon/Documents/GitHub/lab/emotion-error-test/node_modules/stylis/package.json` was successfully found. However, this package itself specifies a `main` module field that could not be resolved (`/Users/evanbacon/Documents/GitHub/lab/emotion-error-test/node_modules/stylis/dist/stylis.mjs`. Indeed, none of these files exist:\n' +
            //     '\n' +
            //     '  * /Users/evanbacon/Documents/GitHub/lab/emotion-error-test/node_modules/stylis/dist/stylis.mjs(.web.ts|.ts|.web.tsx|.tsx|.web.js|.js|.web.jsx|.jsx|.web.json|.json|.web.cjs|.cjs|.web.scss|.scss|.web.sass|.sass|.web.css|.css)\n' +
            //     '  * /Users/evanbacon/Documents/GitHub/lab/emotion-error-test/node_modules/stylis/dist/stylis.mjs/index(.web.ts|.ts|.web.tsx|.tsx|.web.js|.js|.web.jsx|.jsx|.web.json|.json|.web.cjs|.cjs|.web.scss|.scss|.web.sass|.sass|.web.css|.css): /Users/evanbacon/Documents/GitHub/lab/emotion-error-test/node_modules/metro/src/node-haste/DependencyGraph.js (289:17)\n' +
            //     '\n' +
            //     '\x1B[0m \x1B[90m 287 |\x1B[39m         }\x1B[0m\n' +
            //     '\x1B[0m \x1B[90m 288 |\x1B[39m         \x1B[36mif\x1B[39m (error \x1B[36minstanceof\x1B[39m \x1B[33mInvalidPackageError\x1B[39m) {\x1B[0m\n' +
            //     '\x1B[0m\x1B[31m\x1B[1m>\x1B[22m\x1B[39m\x1B[90m 289 |\x1B[39m           \x1B[36mthrow\x1B[39m \x1B[36mnew\x1B[39m \x1B[33mPackageResolutionError\x1B[39m({\x1B[0m\n' +
            //     '\x1B[0m \x1B[90m     |\x1B[39m                 \x1B[31m\x1B[1m^\x1B[22m\x1B[39m\x1B[0m\n' +
            //     '\x1B[0m \x1B[90m 290 |\x1B[39m             packageError\x1B[33m:\x1B[39m error\x1B[33m,\x1B[39m\x1B[0m\n' +
            //     '\x1B[0m \x1B[90m 291 |\x1B[39m             originModulePath\x1B[33m:\x1B[39m \x1B[36mfrom\x1B[39m\x1B[33m,\x1B[39m\x1B[0m\n' +
            //     '\x1B[0m \x1B[90m 292 |\x1B[39m             targetModuleName\x1B[33m:\x1B[39m to\x1B[33m,\x1B[39m\x1B[0m'
            // }
            // The Metro logger already showed this error.
            throw new Error(data.message);
        }
        throw new Error("Invalid resources returned from the Metro serializer. Expected array, found: " + data);
    }
    async getStaticPageAsync(pathname) {
        const { mode , isExporting , baseUrl , routerRoot , asyncRoutes  } = this.instanceMetroOptions;
        (0, _assert().default)(mode != null && isExporting != null && baseUrl != null && routerRoot != null && asyncRoutes != null, "The server must be started before calling getStaticPageAsync.");
        const platform = "web";
        const devBundleUrlPathname = (0, _metroOptions.createBundleUrlPath)({
            splitChunks: isExporting && !_env1.env.EXPO_NO_BUNDLE_SPLITTING,
            platform,
            mode,
            environment: "client",
            mainModuleName: (0, _manifestMiddleware.resolveMainModuleName)(this.projectRoot, {
                platform
            }),
            lazy: (0, _metroOptions.shouldEnableAsyncImports)(this.projectRoot),
            baseUrl,
            isExporting,
            asyncRoutes,
            routerRoot,
            bytecode: false
        });
        const bundleStaticHtml = async ()=>{
            const { getStaticContent  } = await this.ssrLoadModule("expo-router/node/render.js", {
                minify: false,
                mode,
                isExporting,
                platform
            });
            const location = new URL(pathname, this.getDevServerUrl());
            return await getStaticContent(location);
        };
        const [{ artifacts: resources  }, staticHtml] = await Promise.all([
            this.getStaticResourcesAsync(),
            bundleStaticHtml(), 
        ]);
        const content = (0, _serializeHtml.serializeHtmlWithAssets)({
            isExporting,
            resources,
            template: staticHtml,
            devBundleUrl: devBundleUrlPathname,
            baseUrl
        });
        return {
            content,
            resources
        };
    }
    // Set when the server is started.
    instanceMetroOptions = {};
    async ssrLoadModule(filePath, specificOptions = {}) {
        const { baseUrl , routerRoot , isExporting  } = this.instanceMetroOptions;
        (0, _assert().default)(baseUrl != null && routerRoot != null && isExporting != null, "The server must be started before calling ssrLoadModule.");
        return (await (0, _getStaticRenderFunctions.getStaticRenderFunctionsForEntry)(this.projectRoot, this.getDevServerUrl(), {
            // Bundle in Node.js mode for SSR.
            environment: "node",
            platform: "web",
            mode: "development",
            bytecode: false,
            ...this.instanceMetroOptions,
            baseUrl,
            routerRoot,
            isExporting,
            ...specificOptions
        }, filePath)).fn;
    }
    async ssrLoadModuleContents(filePath, specificOptions = {}) {
        const { baseUrl , routerRoot , isExporting  } = this.instanceMetroOptions;
        (0, _assert().default)(baseUrl != null && routerRoot != null && isExporting != null, "The server must be started before calling ssrLoadModule.");
        return await (0, _getStaticRenderFunctions.requireFileContentsWithMetro)(this.projectRoot, this.getDevServerUrl(), filePath, {
            // Bundle in Node.js mode for SSR.
            environment: "node",
            platform: "web",
            mode: "development",
            bytecode: false,
            ...this.instanceMetroOptions,
            baseUrl,
            routerRoot,
            isExporting,
            ...specificOptions
        });
    }
    async watchEnvironmentVariables() {
        if (!this.instance) {
            throw new Error("Cannot observe environment variable changes without a running Metro instance.");
        }
        if (!this.metro) {
            // This can happen when the run command is used and the server is already running in another
            // process.
            debug("Skipping Environment Variable observation because Metro is not running (headless).");
            return;
        }
        const envFiles = _env().getFiles(process.env.NODE_ENV).map((fileName)=>_path().default.join(this.projectRoot, fileName));
        (0, _waitForMetroToObserveTypeScriptFile.observeFileChanges)({
            metro: this.metro,
            server: this.instance.server
        }, envFiles, ()=>{
            debug("Reloading environment variables...");
            // Force reload the environment variables.
            _env().load(this.projectRoot, {
                force: true
            });
        });
    }
    getExpoLineOptions() {
        return this.instanceMetroOptions;
    }
    async startImplementationAsync(options) {
        var ref;
        options.port = await this.resolvePortAsync(options);
        this.urlCreator = this.getUrlCreator(options);
        const config = (0, _config().getConfig)(this.projectRoot, {
            skipSDKVersionRequirement: true
        });
        const { exp  } = config;
        var ref1;
        const useServerRendering = [
            "static",
            "server"
        ].includes((ref1 = (ref = exp.web) == null ? void 0 : ref.output) != null ? ref1 : "");
        const baseUrl = (0, _metroOptions.getBaseUrlFromExpoConfig)(exp);
        var _mode;
        const asyncRoutes = (0, _metroOptions.getAsyncRoutesFromExpoConfig)(exp, (_mode = options.mode) != null ? _mode : "development", "web");
        const routerRoot = (0, _router.getRouterDirectoryModuleIdWithManifest)(this.projectRoot, exp);
        const appDir = _path().default.join(this.projectRoot, routerRoot);
        var _mode1;
        const mode = (_mode1 = options.mode) != null ? _mode1 : "development";
        this.instanceMetroOptions = {
            isExporting: !!options.isExporting,
            baseUrl,
            mode,
            routerRoot,
            minify: options.minify,
            asyncRoutes
        };
        const parsedOptions = {
            port: options.port,
            maxWorkers: options.maxWorkers,
            resetCache: options.resetDevServer
        };
        // Required for symbolication:
        process.env.EXPO_DEV_SERVER_ORIGIN = `http://localhost:${options.port}`;
        const { metro , server , middleware , messageSocket  } = await (0, _instantiateMetro.instantiateMetroAsync)(this, parsedOptions, {
            isExporting: !!options.isExporting
        });
        const manifestMiddleware = await this.getManifestMiddlewareAsync(options);
        // Important that we noop source maps for context modules as soon as possible.
        (0, _mutations.prependMiddleware)(middleware, new _contextModuleSourceMapsMiddleware.ContextModuleSourceMapsMiddleware().getHandler());
        // We need the manifest handler to be the first middleware to run so our
        // routes take precedence over static files. For example, the manifest is
        // served from '/' and if the user has an index.html file in their project
        // then the manifest handler will never run, the static middleware will run
        // and serve index.html instead of the manifest.
        // https://github.com/expo/expo/issues/13114
        (0, _mutations.prependMiddleware)(middleware, manifestMiddleware.getHandler());
        var _scheme;
        middleware.use(new _interstitialPageMiddleware.InterstitialPageMiddleware(this.projectRoot, {
            // TODO: Prevent this from becoming stale.
            scheme: (_scheme = options.location.scheme) != null ? _scheme : null
        }).getHandler());
        middleware.use(new _reactDevToolsPageMiddleware.ReactDevToolsPageMiddleware(this.projectRoot).getHandler());
        middleware.use(new _devToolsPluginMiddleware.DevToolsPluginMiddleware(this.projectRoot, this.devToolsPluginManager).getHandler());
        const deepLinkMiddleware = new _runtimeRedirectMiddleware.RuntimeRedirectMiddleware(this.projectRoot, {
            onDeepLink: getDeepLinkHandler(this.projectRoot),
            getLocation: ({ runtime  })=>{
                if (runtime === "custom") {
                    var ref;
                    return (ref = this.urlCreator) == null ? void 0 : ref.constructDevClientUrl();
                } else {
                    var ref1;
                    return (ref1 = this.urlCreator) == null ? void 0 : ref1.constructUrl({
                        scheme: "exp"
                    });
                }
            }
        });
        middleware.use(deepLinkMiddleware.getHandler());
        middleware.use(new _createFileMiddleware.CreateFileMiddleware(this.projectRoot).getHandler());
        // Append support for redirecting unhandled requests to the index.html page on web.
        if (this.isTargetingWeb()) {
            // This MUST be after the manifest middleware so it doesn't have a chance to serve the template `public/index.html`.
            middleware.use(new _serveStaticMiddleware.ServeStaticMiddleware(this.projectRoot).getHandler());
            // This should come after the static middleware so it doesn't serve the favicon from `public/favicon.ico`.
            middleware.use(new _faviconMiddleware.FaviconMiddleware(this.projectRoot).getHandler());
            if (useServerRendering) {
                var ref2;
                middleware.use((0, _createServerRouteMiddleware.createRouteHandlerMiddleware)(this.projectRoot, {
                    appDir,
                    routerRoot,
                    config,
                    ...(ref2 = config.exp.extra) == null ? void 0 : ref2.router,
                    bundleApiRoute: (functionFilePath)=>this.ssrImportApiRoute(functionFilePath),
                    getStaticPageAsync: (pathname)=>{
                        return this.getStaticPageAsync(pathname);
                    }
                }));
                (0, _waitForMetroToObserveTypeScriptFile.observeAnyFileChanges)({
                    metro,
                    server
                }, (events)=>{
                    var ref;
                    if (((ref = exp.web) == null ? void 0 : ref.output) === "server") {
                        // NOTE(EvanBacon): We aren't sure what files the API routes are using so we'll just invalidate
                        // aggressively to ensure we always have the latest. The only caching we really get here is for
                        // cases where the user is making subsequent requests to the same API route without changing anything.
                        // This is useful for testing but pretty suboptimal. Luckily our caching is pretty aggressive so it makes
                        // up for a lot of the overhead.
                        this.invalidateApiRouteCache();
                    } else if (!(0, _router.hasWarnedAboutApiRoutes)()) {
                        for (const event of events){
                            var // If the user did not delete a file that matches the Expo Router API Route convention, then we should warn that
                            // API Routes are not enabled in the project.
                            ref1;
                            if (((ref1 = event.metadata) == null ? void 0 : ref1.type) !== "d" && // Ensure the file is in the project's routes directory to prevent false positives in monorepos.
                            event.filePath.startsWith(appDir) && (0, _router.isApiRouteConvention)(event.filePath)) {
                                (0, _router.warnInvalidWebOutput)();
                            }
                        }
                    }
                });
            } else {
                // This MUST run last since it's the fallback.
                middleware.use(new _historyFallbackMiddleware.HistoryFallbackMiddleware(manifestMiddleware.getHandler().internal).getHandler());
            }
        }
        // Extend the close method to ensure that we clean up the local info.
        const originalClose = server.close.bind(server);
        server.close = (callback)=>{
            return originalClose((err)=>{
                this.instance = null;
                this.metro = null;
                callback == null ? void 0 : callback(err);
            });
        };
        this.metro = metro;
        return {
            server,
            location: {
                // The port is the main thing we want to send back.
                port: options.port,
                // localhost isn't always correct.
                host: "localhost",
                // http is the only supported protocol on native.
                url: `http://localhost:${options.port}`,
                protocol: "http"
            },
            middleware,
            messageSocket
        };
    }
    async waitForTypeScriptAsync() {
        if (!this.instance) {
            throw new Error("Cannot wait for TypeScript without a running server.");
        }
        return new Promise((resolve)=>{
            if (!this.metro) {
                // This can happen when the run command is used and the server is already running in another
                // process. In this case we can't wait for the TypeScript check to complete because we don't
                // have access to the Metro server.
                debug("Skipping TypeScript check because Metro is not running (headless).");
                return resolve(false);
            }
            const off = (0, _metroWatchTypeScriptFiles.metroWatchTypeScriptFiles)({
                projectRoot: this.projectRoot,
                server: this.instance.server,
                metro: this.metro,
                tsconfig: true,
                throttle: true,
                eventTypes: [
                    "change",
                    "add"
                ],
                callback: async ()=>{
                    // Run once, this prevents the TypeScript project prerequisite from running on every file change.
                    off();
                    const { TypeScriptProjectPrerequisite  } = await Promise.resolve().then(()=>/*#__PURE__*/ _interopRequireWildcard(require("../../doctor/typescript/TypeScriptProjectPrerequisite.js")));
                    try {
                        const req = new TypeScriptProjectPrerequisite(this.projectRoot);
                        await req.bootstrapAsync();
                        resolve(true);
                    } catch (error) {
                        // Ensure the process doesn't fail if the TypeScript check fails.
                        // This could happen during the install.
                        _log.Log.log();
                        _log.Log.error(_chalk().default.red`Failed to automatically setup TypeScript for your project. Try restarting the dev server to fix.`);
                        _log.Log.exception(error);
                        resolve(false);
                    }
                }
            });
        });
    }
    async startTypeScriptServices() {
        var ref;
        return (0, _startTypescriptTypeGeneration.startTypescriptTypeGenerationAsync)({
            server: (ref = this.instance) == null ? void 0 : ref.server,
            metro: this.metro,
            projectRoot: this.projectRoot
        });
    }
    getConfigModuleIds() {
        return [
            "./metro.config.js",
            "./metro.config.json",
            "./rn-cli.config.js"
        ];
    }
    pendingRouteOperations = new Map();
    // API Routes
    // Bundle the API Route with Metro and return the string contents to be evaluated in the server.
    async bundleApiRoute(filePath) {
        if (this.pendingRouteOperations.has(filePath)) {
            return this.pendingRouteOperations.get(filePath);
        }
        const bundleAsync = async ()=>{
            try {
                debug("Bundle API route:", this.instanceMetroOptions.routerRoot, filePath);
                return await this.ssrLoadModuleContents(filePath);
            } catch (error) {
                if (error instanceof Error) {
                    await (0, _metroErrorInterface.logMetroErrorAsync)({
                        error,
                        projectRoot: this.projectRoot
                    });
                }
                throw error;
            } finally{
            // pendingRouteOperations.delete(filepath);
            }
        };
        const route = bundleAsync();
        this.pendingRouteOperations.set(filePath, route);
        return route;
    }
    async ssrImportApiRoute(filePath) {
        // TODO: Cache the evaluated function.
        try {
            const apiRoute = await this.bundleApiRoute(filePath);
            if (!(apiRoute == null ? void 0 : apiRoute.src)) {
                return null;
            }
            return (0, _getStaticRenderFunctions.evalMetroNoHandling)(this.projectRoot, apiRoute.src, apiRoute.filename);
        } catch (error) {
            // Format any errors that were thrown in the global scope of the evaluation.
            if (error instanceof Error) {
                try {
                    const htmlServerError = await (0, _metroErrorInterface.getErrorOverlayHtmlAsync)({
                        error,
                        projectRoot: this.projectRoot,
                        routerRoot: this.getExpoLineOptions().routerRoot
                    });
                    return new Response(htmlServerError, {
                        status: 500,
                        headers: {
                            "Content-Type": "text/html"
                        }
                    });
                } catch (internalError) {
                    debug("Failed to generate Metro server error UI for API Route error:", internalError);
                    throw error;
                }
            } else {
                throw error;
            }
        }
    }
    invalidateApiRouteCache() {
        this.pendingRouteOperations.clear();
    }
}
function getDeepLinkHandler(projectRoot) {
    return async ({ runtime  })=>{
        if (runtime === "expo") return;
        const { exp  } = (0, _config().getConfig)(projectRoot);
        await (0, _telemetry.logEventAsync)("dev client start command", {
            status: "started",
            ...(0, _getDevClientProperties.default)(projectRoot, exp)
        });
    };
}

//# sourceMappingURL=MetroBundlerDevServer.js.map