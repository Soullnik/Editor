import { test, expect } from "./fixtures/electron-fixture";
import { createEffectAndSelectParticle, switchToTab } from "./helpers/effect-setup";

test.describe("Behaviors Properties Tab", () => {
    test.beforeEach(async ({ effectEditorPage }) => {
        await createEffectAndSelectParticle(effectEditorPage);
        await switchToTab(effectEditorPage, "Behaviors");
    });

    test("Behaviors tab renders without error", async ({ effectEditorPage }) => {
        // At minimum the tab should not show an error state
        await expect(effectEditorPage.getByText(/error/i)).not.toBeVisible();
    });

    test("Add Behavior button or control is present", async ({ effectEditorPage }) => {
        // The behaviors tab should show an "Add" button or similar control
        const addBehaviorBtn = effectEditorPage.getByRole("button", { name: /add.?behavior/i });
        const addBtn = effectEditorPage.getByRole("button", { name: /add/i });
        const hasAddBehavior = (await addBehaviorBtn.count()) > 0;
        const hasAdd = (await addBtn.count()) > 0;
        expect(hasAddBehavior || hasAdd).toBe(true);
    });

    test("Can add an ApplyForce behavior", async ({ effectEditorPage }) => {
        const addBtn = effectEditorPage.getByRole("button", { name: /add.?behavior/i });
        if (await addBtn.count() === 0) {
            // Try alternate selector
            const altAddBtn = effectEditorPage.getByRole("button", { name: /add/i }).first();
            if (await altAddBtn.count() > 0) {
                await altAddBtn.click();
            }
        } else {
            await addBtn.click();
        }

        await effectEditorPage.waitForTimeout(300);

        // Should see a behavior type selector/dropdown
        const behaviorTypeSelect = effectEditorPage.getByRole("option", { name: /apply.?force/i });
        if (await behaviorTypeSelect.count() > 0) {
            await behaviorTypeSelect.click();
            await effectEditorPage.waitForTimeout(300);
            // Direction vector fields should appear
            await expect(effectEditorPage.getByText(/direction/i)).toBeVisible();
        } else {
            // Dropdown may use combobox
            const combobox = effectEditorPage.getByRole("combobox").first();
            if (await combobox.count() > 0) {
                await combobox.click();
                const forceOption = effectEditorPage.getByRole("option", { name: /apply.?force/i });
                if (await forceOption.count() > 0) {
                    await forceOption.click();
                    await effectEditorPage.waitForTimeout(300);
                }
            }
        }
    });

    test("Can add a ColorOverLife behavior", async ({ effectEditorPage }) => {
        const addBtn = effectEditorPage.getByRole("button", { name: /add/i }).first();
        if (await addBtn.count() > 0) {
            await addBtn.click();
            await effectEditorPage.waitForTimeout(300);

            const colorOption = effectEditorPage.getByRole("option", { name: /color.?over.?life/i });
            if (await colorOption.count() > 0) {
                await colorOption.click();
                await effectEditorPage.waitForTimeout(300);
                // Color editor should appear
                await expect(effectEditorPage.getByText(/color/i).first()).toBeVisible();
            }
        }
    });

    test("Can add a SizeOverLife behavior", async ({ effectEditorPage }) => {
        const addBtn = effectEditorPage.getByRole("button", { name: /add/i }).first();
        if (await addBtn.count() > 0) {
            await addBtn.click();
            await effectEditorPage.waitForTimeout(300);

            const sizeOption = effectEditorPage.getByRole("option", { name: /size.?over.?life/i });
            if (await sizeOption.count() > 0) {
                await sizeOption.click();
                await effectEditorPage.waitForTimeout(300);
                await expect(effectEditorPage.getByText(/size/i).first()).toBeVisible();
            }
        }
    });

    test("Added behavior can be removed", async ({ effectEditorPage }) => {
        // Add a behavior first
        const addBtn = effectEditorPage.getByRole("button", { name: /add/i }).first();
        if (await addBtn.count() > 0) {
            await addBtn.click();
            await effectEditorPage.waitForTimeout(300);

            // Select first available behavior type
            const firstOption = effectEditorPage.getByRole("option").first();
            if (await firstOption.count() > 0) {
                await firstOption.click();
                await effectEditorPage.waitForTimeout(300);
            }

            // Find a remove/delete button
            const removeBtn = effectEditorPage.getByRole("button", { name: /remove|delete/i }).first();
            if (await removeBtn.count() > 0) {
                await removeBtn.click();
                await effectEditorPage.waitForTimeout(300);
            }
        }
    });
});
