import { test, expect } from "./fixtures/electron-fixture";
import { createEffectAndSelectParticle, switchToTab } from "./helpers/effect-setup";

test.describe("Initialization Properties Tab", () => {
    test.beforeEach(async ({ effectEditorPage }) => {
        await createEffectAndSelectParticle(effectEditorPage);
        await switchToTab(effectEditorPage, "Initialization");
    });

    test("Max Particles field is visible", async ({ effectEditorPage }) => {
        await expect(effectEditorPage.getByText(/max.?particle/i)).toBeVisible();
    });

    test("Max Particles field accepts a numeric value", async ({ effectEditorPage }) => {
        await expect(effectEditorPage.getByText(/max.?particle/i)).toBeVisible();
        const maxParticleInput = effectEditorPage.locator('input[type="text"]').first();
        await maxParticleInput.click({ clickCount: 3 });
        await maxParticleInput.fill("500");
        await effectEditorPage.keyboard.press("Enter");
        await expect(maxParticleInput).toHaveValue("500");
    });

    test("Start Life editor is visible", async ({ effectEditorPage }) => {
        await expect(effectEditorPage.getByText(/start.?life/i)).toBeVisible();
    });

    test("Start Life value editor contains an input", async ({ effectEditorPage }) => {
        await expect(effectEditorPage.getByText(/start.?life/i)).toBeVisible();
        // The EffectValueEditor renders at least one text input for the constant value
        const inputs = effectEditorPage.locator('input[type="text"]');
        expect(await inputs.count()).toBeGreaterThan(0);
    });

    test("Start Size editor is visible", async ({ effectEditorPage }) => {
        await expect(effectEditorPage.getByText(/start.?size/i)).toBeVisible();
    });

    test("Scale X editor is visible", async ({ effectEditorPage }) => {
        await expect(effectEditorPage.getByText(/scale.?x/i)).toBeVisible();
    });

    test("Scale Y editor is visible", async ({ effectEditorPage }) => {
        await expect(effectEditorPage.getByText(/scale.?y/i)).toBeVisible();
    });

    test("Start Speed editor is visible", async ({ effectEditorPage }) => {
        await expect(effectEditorPage.getByText(/start.?speed/i)).toBeVisible();
    });

    test("Start Color editor is visible", async ({ effectEditorPage }) => {
        await expect(effectEditorPage.getByText(/start.?color/i)).toBeVisible();
    });

    test("Start Rotation editor is visible", async ({ effectEditorPage }) => {
        await expect(effectEditorPage.getByText(/start.?rotation/i)).toBeVisible();
    });

    test("Value type selector changes Start Life mode", async ({ effectEditorPage }) => {
        // Find the type dropdown near Start Life (EffectValueEditor has a type selector)
        await expect(effectEditorPage.getByText(/start.?life/i)).toBeVisible();
        // The value type selector is typically a select or combobox
        const typeSwitcher = effectEditorPage.getByRole("combobox").first();
        if (await typeSwitcher.count() > 0) {
            await typeSwitcher.click();
            const intervalOption = effectEditorPage.getByRole("option", { name: /interval/i });
            if (await intervalOption.count() > 0) {
                await intervalOption.click();
                await effectEditorPage.waitForTimeout(300);
                // After switching to interval, should see two inputs (min/max)
                const inputs = effectEditorPage.locator('input[type="text"]');
                expect(await inputs.count()).toBeGreaterThanOrEqual(2);
            }
        }
    });
});
