import { APP_CONFIG } from "./constants";
import type { HiddenProject } from "./types";

/**
 * Injects UNHIDE button in Auger's toolbar
 */
export class UnhideButton {
	constructor(private readonly onOpenModal: () => void) {}

	mount(container: ParentNode = document): boolean {
		const centerDiv = container.querySelector<HTMLElement>(
			APP_CONFIG.SELECTORS.CONTENT_CENTER,
		);
		if (
			!centerDiv ||
			centerDiv.querySelector(`.${APP_CONFIG.CSS_CLASSES.SHOW_HIDDEN_BTN}`)
		) {
			return false;
		}

		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = `${APP_CONFIG.CSS_CLASSES.SHOW_HIDDEN_BTN} btn btn-success btn-lg btn-block`;
		btn.textContent = "UNHIDE";
		btn.setAttribute("aria-label", "View and manage hidden projects");
		btn.addEventListener("click", (e) => {
			e.preventDefault();
			e.stopPropagation();
			this.onOpenModal();
		});

		const wrapper = document.createElement("div");
		wrapper.className = "content-select-create auger-plus-btn-container";
		wrapper.appendChild(btn);

		centerDiv.appendChild(wrapper);
		return true;
	}
}

export interface ModalCallbacks {
	onUnhide: (projectId: string) => void;
	onUnhideAll: () => void;
}

/**
 * Modal dialog for viewing, filtering, and restoring hidden projects
 */
export class UnhideModal {
	private activeBackdrop: HTMLElement | null = null;
	private currentProjects: HiddenProject[] = [];
	private searchQuery = "";
	private keydownHandler: ((e: KeyboardEvent) => void) | null = null;

	constructor(private readonly callbacks: ModalCallbacks) {}

	open(projects: HiddenProject[]): void {
		this.currentProjects = [...projects];
		this.searchQuery = "";
		this.close();

		const backdrop = document.createElement("div");
		backdrop.className = APP_CONFIG.CSS_CLASSES.MODAL_BACKDROP;
		backdrop.setAttribute("role", "dialog");
		backdrop.setAttribute("aria-modal", "true");
		backdrop.setAttribute("aria-labelledby", "auger-plus-modal-title");

		backdrop.addEventListener("click", (e) => {
			if (e.target === backdrop) this.close();
		});

		backdrop.appendChild(this.renderBox());
		document.body.appendChild(backdrop);
		this.activeBackdrop = backdrop;

		this.keydownHandler = (e: KeyboardEvent) => {
			if (e.key === "Escape") this.close();
		};
		window.addEventListener("keydown", this.keydownHandler);
	}

	refresh(projects: HiddenProject[]): void {
		this.currentProjects = [...projects];
		if (!this.activeBackdrop) return;

		const titleEl = this.activeBackdrop.querySelector<HTMLElement>(
			".auger-plus-modal-title",
		);
		const unhideAllBtn = this.activeBackdrop.querySelector<HTMLButtonElement>(
			".auger-plus-unhide-all-btn",
		);
		const body = this.activeBackdrop.querySelector<HTMLElement>(
			".auger-plus-modal-body",
		);

		if (titleEl)
			titleEl.textContent = `Hidden Projects (${this.currentProjects.length})`;
		if (unhideAllBtn)
			unhideAllBtn.style.display =
				this.currentProjects.length > 0 ? "inline-block" : "none";
		if (body) body.replaceChildren(this.renderList());
	}

	close(): void {
		if (this.keydownHandler) {
			window.removeEventListener("keydown", this.keydownHandler);
			this.keydownHandler = null;
		}
		if (this.activeBackdrop) {
			this.activeBackdrop.remove();
			this.activeBackdrop = null;
		}
	}

	isOpen(): boolean {
		return Boolean(this.activeBackdrop && document.contains(this.activeBackdrop));
	}

	private renderBox(): HTMLElement {
		const box = document.createElement("div");
		box.className = APP_CONFIG.CSS_CLASSES.MODAL_BOX;

		// Header
		const header = document.createElement("div");
		header.className = "auger-plus-modal-header";

		const title = document.createElement("h3");
		title.id = "auger-plus-modal-title";
		title.className = "auger-plus-modal-title";
		title.textContent = `Hidden Projects (${this.currentProjects.length})`;

		const closeIcon = document.createElement("button");
		closeIcon.type = "button";
		closeIcon.className = "auger-plus-modal-close-icon";
		closeIcon.textContent = "×";
		closeIcon.setAttribute("aria-label", "Close dialog");
		closeIcon.addEventListener("click", () => this.close());

		header.appendChild(title);
		header.appendChild(closeIcon);
		box.appendChild(header);

		// Search bar if >3 projects
		if (this.currentProjects.length > 3) {
			const searchWrapper = document.createElement("div");
			searchWrapper.className = "auger-plus-modal-search-wrapper";

			const searchInput = document.createElement("input");
			searchInput.type = "text";
			searchInput.className = "auger-plus-modal-search";
			searchInput.placeholder = "Search hidden projects...";
			searchInput.setAttribute("aria-label", "Filter hidden projects");

			searchInput.addEventListener("input", (e) => {
				this.searchQuery = (e.target as HTMLInputElement).value.toLowerCase();
				const body = box.querySelector<HTMLElement>(".auger-plus-modal-body");
				if (body) body.replaceChildren(this.renderList());
			});

			searchWrapper.appendChild(searchInput);
			box.appendChild(searchWrapper);
		}

		// Body
		const body = document.createElement("div");
		body.className = "auger-plus-modal-body";
		body.appendChild(this.renderList());
		box.appendChild(body);

		// Footer
		const footer = document.createElement("div");
		footer.className = "auger-plus-modal-footer";

		const unhideAllBtn = document.createElement("button");
		unhideAllBtn.type = "button";
		unhideAllBtn.className = "auger-plus-unhide-all-btn";
		unhideAllBtn.textContent = "Unhide All";
		unhideAllBtn.style.display =
			this.currentProjects.length > 0 ? "inline-block" : "none";
		unhideAllBtn.addEventListener("click", () => this.callbacks.onUnhideAll());

		const closeBtn = document.createElement("button");
		closeBtn.type = "button";
		closeBtn.className = "auger-plus-modal-close-btn";
		closeBtn.textContent = "Close";
		closeBtn.addEventListener("click", () => this.close());

		footer.appendChild(unhideAllBtn);
		footer.appendChild(closeBtn);
		box.appendChild(footer);

		return box;
	}

	private renderList(): HTMLElement {
		const list = document.createElement("div");
		list.className = "auger-plus-project-list";

		const filtered = this.currentProjects.filter((p) => {
			if (!this.searchQuery) return true;
			return (
				p.name.toLowerCase().includes(this.searchQuery) ||
				p.id.toLowerCase().includes(this.searchQuery)
			);
		});

		if (filtered.length === 0) {
			const empty = document.createElement("div");
			empty.className = "auger-plus-empty-state";
			empty.textContent =
				this.currentProjects.length === 0
					? "No projects are currently hidden."
					: "No matching projects found.";
			list.appendChild(empty);
			return list;
		}

		for (const project of filtered) {
			const row = document.createElement("div");
			row.className = "auger-plus-project-row";

			const name = document.createElement("span");
			name.className = "auger-plus-project-name";
			name.textContent = project.name || project.id;

			const unhideBtn = document.createElement("button");
			unhideBtn.type = "button";
			unhideBtn.className = "auger-plus-unhide-btn";
			unhideBtn.textContent = "Unhide";
			unhideBtn.setAttribute("data-project-id", project.id);
			unhideBtn.setAttribute("aria-label", `Unhide project ${project.name}`);
			unhideBtn.addEventListener("click", () =>
				this.callbacks.onUnhide(project.id),
			);

			row.appendChild(name);
			row.appendChild(unhideBtn);
			list.appendChild(row);
		}

		return list;
	}
}

/**
 * Non-interactive update notification toast in bottom-right corner
 */
export class NotificationToast {
	private activeToast: HTMLElement | null = null;
	private timer: ReturnType<typeof setTimeout> | null = null;

	show(newVersion: string, currentVersion: string): void {
		this.dismiss();

		const toast = document.createElement("div");
		toast.className = APP_CONFIG.CSS_CLASSES.UPDATE_TOAST;
		toast.setAttribute("role", "status");
		toast.setAttribute("aria-live", "polite");

		const badge = document.createElement("span");
		badge.className = "auger-plus-toast-badge";
		badge.textContent = "Update";

		const textWrapper = document.createElement("div");
		textWrapper.className = "auger-plus-toast-text";

		const title = document.createElement("div");
		title.className = "auger-plus-toast-title";
		title.textContent = `AugerPlus v${newVersion} Available`;

		const desc = document.createElement("div");
		desc.className = "auger-plus-toast-desc";
		desc.textContent = `Current version is v${currentVersion}. Please update to the latest release.`;

		textWrapper.appendChild(title);
		textWrapper.appendChild(desc);

		toast.appendChild(badge);
		toast.appendChild(textWrapper);

		document.body.appendChild(toast);
		this.activeToast = toast;

		this.timer = setTimeout(
			() => this.dismiss(),
			APP_CONFIG.UPDATE_CHECK.TOAST_DISPLAY_MS,
		);
	}

	dismiss(): void {
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}
		if (this.activeToast) {
			this.activeToast.remove();
			this.activeToast = null;
		}
	}
}
