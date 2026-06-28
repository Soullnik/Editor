import { defineConfig } from "playwright/test";

export default defineConfig({
    testDir: "./test/e2e",
    timeout: 90_000,
    retries: 0,
    workers: 1,
    reporter: [
        ["html", { outputFolder: "playwright-report", open: "never" }],
        ["junit", { outputFile: "playwright-report/results.xml" }],
        ["list"],
    ],
    use: {
        screenshot: "only-on-failure",
        video: "retain-on-failure",
        trace: "retain-on-failure",
    },
});
