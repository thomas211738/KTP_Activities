// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Strongly prevent Metro from resolving/bundling react-native-dotenv at runtime.
// This package must ONLY be used as a Babel transform plugin.
// Its index.js contains top-level `require('fs')` and `require('path')`,
// which is not available in the React Native JS runtime and causes the exact error:
//
//   "The package at "node_modules/react-native-dotenv/index.js" attempted to import
//    the Node standard library module "fs"."
//
// We register the plugin safely in babel.config.js with a static path (like remote HEAD).
// Blocking it here makes the fs error impossible.
config.resolver = {
  ...config.resolver,
  blockList: [
    ...(Array.isArray(config.resolver?.blockList) ? config.resolver.blockList : []),
    /node_modules[/\\]react-native-dotenv[/\\].*/,
  ],
};

module.exports = config;
