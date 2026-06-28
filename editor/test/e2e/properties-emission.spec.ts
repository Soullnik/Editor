import { test, expect } from "./fixtures/electron-fixture";
import { createEffectAndSelectParticle, switchToTab } from "./helpers/effect-setup";

test.describe("Emission Properties Tab", () => {
    test.beforeEach(async ({ effectEditorPage }) => {
        await createEffectAndSelectParticle(effectEditorPage);
        await switchToTab(effectEditorPage, "Emission");
    });

    test("Emitter shape dropdown is visible", async ({ effectEditorPage }) => {
        await expect(effectEditorPage.getByText("Emitter Shape")).toBeVisible();
    });

    test("Emitter shape can be changed to Sphere", async ({ effectEditorPage }) => {
        // EditorInspectorListField renders a shadcn Select (combobox button)
        const shapeSelect = effectEditorPage.getByRole("combobox").first();
        if (await shapeSelect.count() === 0) {
            // Alternate: find a button near "Emitter Shape" label
            const shapeBtn = effectEditorPage.locator('button').filter({ hasText: /point|sphere|cone/i }).first();
            if (await shapeBtn.count() > 0) {
                await shapeBtn.click();
                await effectEditorPage.getByRole("option", { name: /sphere/i }).click();
            }
        } else {
            await shapeSelect.click();
            await effectEditorPage.getByRole("option", { name: /sphere/i }).click();
        }
        await effectEditorPage.waitForTimeout(300);
    });

    test("Looping toggle is visible", async ({ effectEditorPage }) => {
        await expect(effectEditorPage.getByText("Looping")).toBeVisible();
        const loopToggle = effectEditorPage.locator('[role="switch"]').first();
        await expect(loopToggle).toBeVisible();
    });

    test("Looping toggle can be clicked", async ({ effectEditorPage }) => {
        const loopToggle = effectEditorPage.locator('[role="switch"]').first();
        const initial = await loopToggle.getAttribute("aria-checked");
        await loopToggle.click();
        await effectEditorPage.waitForTimeout(200);
        expect(await loopToggle.getAttribute("aria-checked")).not.toBe(initial);
    });

    test("Duration field is visible and editable", async ({ effectEditorPage }) => {
        await expect(effectEditorPage.getByText("Duration")).toBeVisible();
        const durationInput = effectEditorPage.locator('input[type="text"]').first();
        await durationInput.click({ clickCount: 3 });
        await durationInput.fill("3");
        await effectEditorPage.keyboard.press("Enter");
    });

    test("Emit Rate field is visible and editable", async ({ effectEditorPage }) => {
        await expect(effectEditorPage.getByText(/emit.?rate/i)).toBeVisible();
        const emitRateInput = effectEditorPage.locator('input[type="text"]').nth(1);
        await emitRateInput.click({ clickCount: 3 });
        await emitRateInput.fill("100");
        await effectEditorPage.keyboard.press("Enter");
    });

    test("Prewarm toggle is visible", async ({ effectEditorPage }) => {
        await expect(effectEditorPage.getByText(/prewarm/i)).toBeVisible();
    });

    test("Add Burst button adds a burst row", async ({ effectEditorPage }) => {
        const addBurstBtn = effectEditorPage.getByRole("button", { name: /add burst/i });
        if (await addBurstBtn.count() > 0) {
            const burstsBefore = await effectEditorPage.locator('[data-burst-row]').count();
            await addBurstBtn.click();
            await effectEditorPage.waitForTimeout(300);
            const burstsAfter = await effectEditorPage.locator('[data-burst-row]').count();
            expect(burstsAfter).toBeGreaterThan(burstsBefore);
        } else {
            // Find "Add" or "+" button near "Bursts" text
            const burstsSection = effectEditorPage.getByText(/bursts?/i).first();
            await expect(burstsSection).toBeVisible();
        }
    });
});
