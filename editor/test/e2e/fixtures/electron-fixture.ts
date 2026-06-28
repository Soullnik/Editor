import { test as base, _electron, Page } from "playwright/test";
import path from "path";
import fs from "fs";

export interface EffectEditorFixtures {
    effectEditorPage: Page;
}

const EDITOR_ROOT = path.join(__dirname, "../../..");
const TEST_MAIN = path.join(__dirname, "test-main.cjs");

/** Resolves the path to the Electron binary, checking the local workspace and npx cache. */
function resolveElectronBinary(): string {
    const candidates = [
        // Yarn workspace install (hoisted)
        path.join(EDITOR_ROOT, "node_modules/electron/dist/electron"),
        // Editor-local install
        path.join(EDITOR_ROOT, "editor/node_modules/electron/dist/electron"),
        // npx cache (checked by path.txt inside each npx hash directory)
        ...(() => {
            try {
                const npxDir = path.join(process.env.HOME || "/root", ".npm/_npx");
                return fs.readdirSync(npxDir).flatMap((hash) => {
                    const electronPkg = path.join(npxDir, hash, "node_modules/electron");
                    const pathTxt = path.join(electronPkg, "path.txt");
                    if (fs.existsSync(pathTxt)) {
                        const bin = fs.readFileSync(pathTxt, "utf8").trim();
                        return [path.join(electronPkg, "dist", bin)];
                    }
                    return [];
                });
            } catch {
                return [];
            }
        })(),
    ];
    const found = candidates.find((c) => fs.existsSync(c));
    if (!found) {
        throw new Error("Electron binary not found. Run `yarn install` or `npx electron` once to populate the cache.");
    }
    return found;
}

export const test = base.extend<EffectEditorFixtures>({
    effectEditorPage: async ({}, use) => {
        const executablePath = resolveElectronBinary();

        const app = await _electron.launch({
            executablePath,
            args: ["--no-sandbox", TEST_MAIN],
            env: {
                ...process.env,
                NODE_ENV: "test",
            },
        });

        const page = await app.firstWindow();

        // Wait for the effect editor toolbar to appear, indicating React has mounted.
        await page.getByText("Effect Editor").waitFor({ timeout: 30_000 });

        // Give Babylon.js a moment to initialize the WebGL context.
        await page.waitForTimeout(2_000);

        await use(page);

        await app.close();
    },
});

export { expect } from "playwright/test";
