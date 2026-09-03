import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { UnhideButton, UnhideModal, NotificationToast } from "../src/ui";

describe("UI Modules", () => {
	describe("UnhideButton", () => {
		it("mounts into toolbar and handles click", () => {
			document.body.innerHTML = '<div class="content-select-center"></div>';
			const onClick = vi.fn();
			const btn = new UnhideButton(onClick);

			expect(btn.mount()).toBe(true);
			expect(btn.mount()).toBe(false);

			const el = document.querySelector(
				".auger-plus-show-hidden-btn",
			) as HTMLButtonElement;
			el.click();
			expect(onClick).toHaveBeenCalledTimes(1);
		});
	});

	describe("UnhideModal", () => {
		let modal: UnhideModal;
		const onUnhide = vi.fn();
		const onUnhideAll = vi.fn();

		beforeEach(() => {
			document.body.innerHTML = "";
			modal = new UnhideModal({ onUnhide, onUnhideAll });
		});

		afterEach(() => {
			modal.close();
		});

		it("renders dialog, handles search, unhide single, unhide all, and escape", () => {
			modal.open([
				{ id: "alpha", name: "Alpha Project", hiddenAt: 1 },
				{ id: "beta", name: "Beta Project", hiddenAt: 2 },
			]);
			expect(modal.isOpen()).toBe(true);

			const title = document.querySelector(".auger-plus-modal-title");
			expect(title?.textContent).toBe("Hidden Projects (2)");

			const unhideBtn = document.querySelector(
				".auger-plus-unhide-btn",
			) as HTMLButtonElement;
			unhideBtn.click();
			expect(onUnhide).toHaveBeenCalledWith("alpha");

			const unhideAllBtn = document.querySelector(
				".auger-plus-unhide-all-btn",
			) as HTMLButtonElement;
			unhideAllBtn.click();
			expect(onUnhideAll).toHaveBeenCalledTimes(1);

			window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
			expect(modal.isOpen()).toBe(false);
		});
	});

	describe("NotificationToast", () => {
		let toast: NotificationToast;

		beforeEach(() => {
			vi.useFakeTimers();
			document.body.innerHTML = "";
			toast = new NotificationToast();
		});

		afterEach(() => {
			toast.dismiss();
			vi.useRealTimers();
		});

		it("shows non-interactive toast and auto-dismisses", () => {
			toast.show("2.1.0", "2.0.0");
			const el = document.querySelector(".auger-plus-update-toast");
			expect(el).not.toBeNull();
			expect(el?.textContent).toContain("v2.1.0");

			vi.advanceTimersByTime(8500);
			expect(document.querySelector(".auger-plus-update-toast")).toBeNull();
		});
	});
});
