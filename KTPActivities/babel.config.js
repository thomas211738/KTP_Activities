module.exports = function (api) {
  api.cache(true);

  // === SAFEST POSSIBLE SETUP (remote HEAD compatible + no fs error) ===
  //
  // Remote HEAD used exactly:
  //   ['module:react-native-dotenv', { moduleName: '@env', path: '.env' }]
  //
  // We use ONLY a static string literal for "path".
  // Any require('fs'), require('path'), or computation that Metro can see
  // as pulling Node modules from this file will cause:
  //   "react-native-dotenv ... attempted to import the Node standard library module 'fs'"
  //
  // How production vs development values work:
  // - Normal local: npx expo run:ios  → put dev values in .env or .env.development
  // - Local prod test: npx expo run:ios --configuration Release
  //   → copy real prod values into .env (or set via shell + dashboard later)
  // - Real EAS prod builds: set real values as Environment Variables in the
  //   Expo dashboard for the production profile. They are available as process.env
  //   when the Babel transform runs on the build server.
  //
  // The smart "is this a production build?" logic lives in app.config.ts
  // (using CONFIGURATION, APP_ENV, EAS_BUILD_PROFILE). This file only does the
  // static replacement.

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module:react-native-dotenv',
        {
          moduleName: '@env',
          path: '.env',     // static literal only - exactly like remote HEAD
          allowUndefined: true,
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};