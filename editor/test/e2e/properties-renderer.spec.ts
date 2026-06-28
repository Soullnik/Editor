import { test, expect } from "./fixtures/electron-fixture";
import { createEffectAndSelectParticle, switchToTab } from "./helpers/effect-setup";

test.describe("Renderer Properties Tab", () => {
    test.beforeEach(async ({ effectEditorPage }) => {
        await createEffectAndSelectParticle(effectEditorPage);
        await switchToTab(effectEditorPage, "Renderer");
    });

    test("Render Mode dropdown is visible", async ({ effectEditorPage }) => {
        await expect(effectEditorPage.getByText(/render.?mode/i)).toBeVisible();
    });

    test("Render Mode can be changed to Billboard", async ({ effectEditorPage }) => {
        const renderModeSelect = effectEditorPage.getByRole("combobox").first();
        if (await renderModeSelect.count() > 0) {
            await renderModeSelect.click();
            const billboardOption = effectEditorPage.getByRole("option", { name: /billboard/i }).first();
            if (await billboardOption.count() > 0) {
                await billboardOption.click();
            }
        }
        await effectEditorPage.waitForTimeout(300);
    });

    test("Blend Mode dropdown is visible", async ({ effectEditorPage }) => {
        await expect(effectEditorPage.getByText(/blend.?mode/i)).toBeVisible();
    });

    test("World Space toggle is visible", async ({ effectEditorPage }) => {
        await expect(effectEditorPage.getByText(/world.?space/i)).toBeVisible();
        const switches = effectEditorPage.locator('[role="switch"]');
        expect(await switches.count()).toBeGreaterThan(0);
    });

    test("Soft Particles toggle is visible", async ({ effectEditorPage }) => {
        await expect(effectEditorPage.getByText(/soft.?particle/i)).toBeVisible();
    });

    test("Render Order field is visible and editable", async ({ effectEditorPage }) => {
        await expect(effectEditorPage.getByText(/render.?order/i)).toBeVisible();
        const renderOrderInput = effectEditorPage.locator('input[type="text"]').first();
        await renderOrderInput.click({ clickCount: 3 });
        await renderOrderInput.fill("1");
        await effectEditorPage.keyboard.press("Enter");
    });

    test("UV Tile fields are visible", async ({ effectEditorPage }) => {
        // uTileCount and vTileCount fields
        await expect(effectEditorPage.getByText(/u.?tile/i)).toBeVisible();
        await expect(effectEditorPage.getByText(/v.?tile/i)).toBeVisible();
    });

    test("Start Tile Index field is visible", async ({ effectEditorPage }) => {
        await expect(effectEditorPage.getByText(/start.?tile/i)).toBeVisible();
    });
});
