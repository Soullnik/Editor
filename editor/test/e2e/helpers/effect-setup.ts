import type { Page } from "playwright/test";

/**
 * Creates a new effect in the graph panel via the right-click context menu,
 * then selects the created particle node.
 * Returns once a particle node is selected and properties tabs are active.
 */
export async function createEffectAndSelectParticle(page: Page): Promise<void> {
    // The empty graph shows "No particles. Right-click to add."
    const emptyGraphArea = page.getByText("No particles. Right-click to add.");
    await emptyGraphArea.waitFor({ timeout: 20_000 });

    // Right-click to open context menu.
    await emptyGraphArea.click({ button: "right" });

    // Click "Add" submenu trigger.
    await page.getByRole("menuitem", { name: /add/i }).hover();

    // Click "Effect" in the submenu.
    await page.getByRole("menuitem", { name: /effect/i }).click();

    // Wait for the tree to populate (a node appears in the Particles panel).
    await page.waitForTimeout(1_000);

    // Click on a particle node (it will appear as the first child item in the tree).
    // The tree renders node labels — find a node that is a particle (not the root group).
    const particleNode = page.locator(".bp5-tree-node-label, .bp4-tree-node-label").nth(1);
    if (await particleNode.count() > 0) {
        await particleNode.click();
    } else {
        // Fallback: click the first tree node
        await page.locator(".bp5-tree-node, .bp4-tree-node").first().click();
    }

    // Wait for properties to load (the "No node selected" placeholder should be gone).
    await page.waitForTimeout(500);
}

/**
 * Switches to the given properties tab by clicking its tab button.
 */
export async function switchToTab(page: Page, tabName: "Object" | "Emission" | "Renderer" | "Initialization" | "Behaviors"): Promise<void> {
    // FlexLayout renders tabs as buttons with the tab name text.
    const tabButton = page.getByRole("tab", { name: tabName });
    if (await tabButton.count() > 0) {
        await tabButton.click();
    } else {
        // Fallback: find by text
        await page.getByText(tabName, { exact: true }).first().click();
    }
    await page.waitForTimeout(300);
}
