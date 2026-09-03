import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AugerPlusApp } from "../src/app";
import { ChromeStorageService } from "../src/storage";
import { setupChromeMock } from "./chrome-mock";

describe("AugerPlusApp", () => {
	let mockEnv: ReturnType<typeof setupChromeMock>;
	let app: AugerPlusApp;

	beforeEach(() => {
		mockEnv = setupChromeMock();
		document.body.innerHTML = `
      <div class="content-select-center"></div>
      <div data-testid="pagination-indicator">Showing 1 to 2</div>
      <table class="table">
        <thead><tr><th>Project</th></tr></thead>
        <tbody>
          <tr><td><a href="/projects/p1">Proj 1</a></td></tr>
          <tr><td><a href="/projects/p2">Proj 2</a></td></tr>
        </tbody>
      </table>
    `;
	});

	afterEach(() => {
		app?.destroy();
		mockEnv.clearMock();
	});

	it("initializes UI, handles hiding, and unhiding", async () => {
		const storageService = new ChromeStorageService("app_test");
		app = new AugerPlusApp({
			storageService,
			versionChecker: {
				checkForUpdate: vi.fn().mockResolvedValue({
					hasUpdate: false,
					currentVersion: "2.0.0",
					latestVersion: "2.0.0",
				}),
			},
		});

		await app.initialize();

		expect(document.querySelector(".auger-plus-show-hidden-btn")).not.toBeNull();
		expect(document.querySelector(".auger-plus-hide-column")).not.toBeNull();

		// Click hide button
		const hideBtn = document.querySelector(
			".auger-plus-hide-btn",
		) as HTMLButtonElement;
		hideBtn.click();
		await new Promise((r) => setTimeout(r, 20));

		const stored = await storageService.getHiddenProjects();
		expect(stored).toHaveLength(1);
		expect(stored[0]?.id).toBe("p1");

		// Unhide project
		await app.handleUnhideProject("p1");
		expect(await storageService.getHiddenProjects()).toHaveLength(0);
	});
});
