// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push("cjs");
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
