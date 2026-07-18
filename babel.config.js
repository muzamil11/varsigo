module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    // Note: no explicit reanimated/worklets plugin — babel-preset-expo (SDK 54+)
    // auto-configures react-native-worklets/plugin when the package is installed.
  };
};
