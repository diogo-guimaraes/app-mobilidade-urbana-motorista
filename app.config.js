const fs = require("fs");
const path = require("path");

function lerEnv(nome) {
  if (process.env[nome]) return process.env[nome];

  const arquivo = path.join(__dirname, ".env");

  if (!fs.existsSync(arquivo)) return "";

  const linha = fs
    .readFileSync(arquivo, "utf8")
    .split("\n")
    .find((l) => l.trim().startsWith(`${nome}=`));

  return linha ? linha.slice(linha.indexOf("=") + 1).trim() : "";
}

const ehDesenvolvimento = process.env.APP_VARIANT !== "production";

module.exports = {
  name: "p6driver-frontend",
  slug: "p6driver-frontend",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "p6driverfrontend",

  userInterfaceStyle: "automatic",

  ios: {
    supportsTablet: true,
  },

  android: {
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
    config: {
      googleMaps: { apiKey: lerEnv("GOOGLE_MAPS_ANDROID_KEY") },
    },
  },

  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },

  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: { backgroundColor: "#000000" },
      },
    ],
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission:
          "Permitir $(PRODUCT_NAME) usar sua localização.",
        locationAlwaysPermission:
          "Permitir $(PRODUCT_NAME) usar sua localização.",
        locationWhenInUsePermission:
          "Permitir $(PRODUCT_NAME) usar sua localização.",
      },
    ],
    "expo-font",
    "expo-status-bar",
    "expo-web-browser",
    "expo-audio",
    "expo-asset",
    "expo-secure-store",

    ...(ehDesenvolvimento
      ? [["expo-build-properties", { android: { usesCleartextTraffic: true } }]]
      : []),
  ],

  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};
