import { test, expect } from "./fixtures/electron-fixture";
import { createEffectAndSelectParticle, switchToTab } from "./helpers/effect-setup";

test.describe("Object Properties Tab", () => {
    test.beforeEach(async ({ effectEditorPage }) => {
        await createEffectAndSelectParticle(effectEditorPage);
        await switchToTab(effectEditorPage, "Object");
    });

    test("Name field is visible and editable", async ({ effectEditorPage }) => {
        // The name field renders as a textarea
        const nameInput = effectEditorPage.locator("textarea").first();
        await expect(nameInput).toBeVisible();

        // Type a new name
        await nameInput.click({ clickCount: 3 });
        await nameInput.fill("TestParticle");
        await effectEditorPage.keyboard.press("Tab");
    });

    test("Visibility toggle is visible", async ({ effectEditorPage }) => {
        // EditorInspectorSwitchField renders with label "Visibility"
        await expect(effectEditorPage.getByText("Visibility")).toBeVisible();
        const toggle = effectEditorPage.locator('[role="switch"]').first();
        await expect(toggle).toBeVisible();
    });

    test("Visibility toggle can be clicked", async ({ effectEditorPage }) => {
        const toggle = effectEditorPage.locator('[role="switch"]').first();
        const initialChecked = await toggle.getAttribute("aria-checked");
        await toggle.click();
        await effectEditorPage.waitForTimeout(200);
        const newChecked = await toggle.getAttribute("aria-checked");
        // State should have toggled
        expect(newChecked).not.toBe(initialChecked);
    });

    test("Position fields are visible (X, Y, Z)", async ({ effectEditorPage }) => {
        await expect(effectEditorPage.getByText("Position")).toBeVisible();
        // Vector field renders three text inputs side by side
        const inputs = effectEditorPage.locator('input[type="text"]');
        expect(await inputs.count()).toBeGreaterThanOrEqual(3);
    });

    test("Position X input accepts a numeric value", async ({ effectEditorPage }) => {
        // Find first numeric input (Position X)
        const inputs = effectEditorPage.locator('input[type="text"]');
        const firstInput = inputs.first();
        await firstInput.click({ clickCount: 3 });
        await firstInput.fill("5");
        await effectEditorPage.keyboard.press("Enter");
        await expect(firstInput).toHaveValue("5");
    });

    test("Rotation fields are visible", async ({ effectEditorPage }) => {
        await expect(effectEditorPage.getByText("Rotation")).toBeVisible();
    });

    test("Scale fields are visible", async ({ effectEditorPage }) => {
        await expect(effectEditorPage.getByText("Scale")).toBeVisible();
    });
});
