/**
 * Minimal Electron main process for E2E testing.
 * Directly launches the effect editor window without the full main editor,
 * so tests don't depend on unrelated UI.
 */

const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

// Enable WebGL / SwiftShader for headless environments.
app.commandLine.appendSwitch("enable-unsafe-webgl");
app.commandLine.appendSwitch("ignore-gpu-blacklist");
app.commandLine.appendSwitch("no-sandbox");
app.commandLine.appendSwitch("disable-gpu-sandbox");
app.commandLine.appendSwitch("enable-webgl");
app.commandLine.appendSwitch("use-angle", "swiftshader");

const EDITOR_ROOT = path.join(__dirname, "../../..");
const PRELOAD = path.join(EDITOR_ROOT, "build/src/editor/windows/preload.js");
const EFFECT_EDITOR = path.join(EDITOR_ROOT, "build/src/editor/windows/effect-editor");
const INDEX_HTML = path.join(EDITOR_ROOT, "index.html");

app.whenReady().then(() => {
    const win = new BrowserWindow({
        width: 1440,
        height: 900,
        show: true,
        frame: false,
        webPreferences: {
            nodeIntegration: true,
            nodeIntegrationInWorker: true,
            contextIsolation: false,
            preload: PRELOAD,
        },
    });

    win.loadFile(INDEX_HTML);

    // When the preload has finished loading, inject the effect editor module.
    win.webContents.on("did-finish-load", () => {
        win.webContents.send("editor:window-launch-data", EFFECT_EDITOR, {});
    });

    // Acknowledge the "window ready" signal from the preload.
    ipcMain.on("editor:window-ready", () => {});
});
