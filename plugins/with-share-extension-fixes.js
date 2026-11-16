// Fixes for expo-share-extension 5.0.6 on Expo SDK 58.
//
// 1. The plugin hard-codes IPHONEOS_DEPLOYMENT_TARGET = 15.1 for the extension
//    target, but SDK 58 modules need iOS 16.4+.
// 2. The extension's view controller starts React with a plain
//    RCTReactNativeFactory, so the Expo modules runtime (globalThis.expo) is
//    never installed and any Expo module import (including expo-share-extension
//    itself: close/openHostApp) throws "Cannot read property 'EventEmitter' of
//    undefined". Use ExpoReactNativeFactory, as the main app does.
//
// This plugin must be listed BEFORE "expo-share-extension" so its mod runs after.
const fs = require("fs");
const path = require("path");
const { withXcodeProject } = require("expo/config-plugins");

const TARGET = "16.4";

function patchSwift(file) {
  let src = fs.readFileSync(file, "utf8");
  if (src.includes("ExpoReactNativeFactory")) return;

  const replacements = [
    ["import React_RCTAppDelegate", "import React_RCTAppDelegate\ninternal import Expo"],
    [
      "class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate",
      "class ReactNativeDelegate: ExpoReactNativeFactoryDelegate",
    ],
    [
      "RCTReactNativeFactory(delegate: reactNativeFactoryDelegate!)",
      "ExpoReactNativeFactory(delegate: reactNativeFactoryDelegate!)",
    ],
  ];
  for (const [from, to] of replacements) {
    if (!src.includes(from)) {
      throw new Error(`with-share-extension-fixes: could not find "${from}"`);
    }
    src = src.replace(from, to);
  }
  fs.writeFileSync(file, src);
}

module.exports = function withShareExtensionFixes(config) {
  return withXcodeProject(config, (cfg) => {
    const configs = cfg.modResults.pbxXCBuildConfigurationSection();
    for (const key of Object.keys(configs)) {
      const settings = configs[key].buildSettings;
      if (
        settings &&
        String(settings.IPHONEOS_DEPLOYMENT_TARGET).replace(/"/g, "") === "15.1"
      ) {
        settings.IPHONEOS_DEPLOYMENT_TARGET = TARGET;
      }
    }

    const root = cfg.modRequest.platformProjectRoot;
    const extDir = fs
      .readdirSync(root)
      .find((d) => d.endsWith("ShareExtension"));
    if (!extDir) throw new Error("with-share-extension-fixes: extension dir not found");
    patchSwift(path.join(root, extDir, "ShareExtensionViewController.swift"));
    return cfg;
  });
};
