const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ignore unnecessary directories to reduce file watchers
config.watchFolders = [__dirname];
config.resolver.blockList = [
  /node_modules\/.*\/node_modules\/react-native\/.*/,
];

// Don't watch these directories
config.watchFolders = config.watchFolders || [];
config.resolver.sourceExts = ['js', 'jsx', 'json', 'ts', 'tsx', 'mjs'];

module.exports = config;
