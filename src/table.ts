import { APP_CONFIG } from "./constants";
import type { HiddenProject, ProjectRowInfo } from "./types";

/**
 * Parses project rows to extract ID and Name safely
 */
export class TableParser {
	getProjectIdFromRow(row: HTMLTableRowElement): string | null {
		const firstCell = row.querySelector<HTMLTableCellElement>(
			APP_CONFIG.SELECTORS.TABLE_CELL,
		);
		if (!firstCell) return null;

		const link = firstCell.querySelector<HTMLAnchorElement>("a");
		if (link) {
			const href = link.getAttribute("href") || "";
			const match = href.match(/\/([^\/?#]+)(?:[?#].*)?$/);
			if (match && match[1]) {
				return match[1].trim();
			}
		}

		const cellText = (firstCell.textContent || "").trim();
		return cellText.length > 0 ? cellText : null;
	}

	getProjectNameFromRow(row: HTMLTableRowElement): string | null {
		const firstCell = row.querySelector<HTMLTableCellElement>(
			APP_CONFIG.SELECTORS.TABLE_CELL,
		);
		if (!firstCell) return null;

		const link = firstCell.querySelector<HTMLAnchorElement>("a");
		if (link) {
			const text = (link.textContent || "").trim();
			if (text) return text;
		}

		const cellText = (firstCell.textContent || "").trim();
		return cellText.length > 0 ? cellText : null;
	}

	parseRow(row: HTMLTableRowElement): ProjectRowInfo | null {
		const id = this.getProjectIdFromRow(row);
		if (!id) return null;

		const name = this.getProjectNameFromRow(row) || id;
		return { id, name, rowElement: row };
	}

	getTableRows(table: HTMLTableElement): HTMLTableRowElement[] {
		return Array.from(
			table.querySelectorAll<HTMLTableRowElement>(
				APP_CONFIG.SELECTORS.TABLE_BODY,
			),
		);
	}
}

/**
 * Injects Hide header and row action buttons with delegated and direct click handling
 */
export class TableEnhancer {
	constructor(
		private readonly tableParser: TableParser = new TableParser(),
		private readonly onHide: (project: { id: string; name: string }) => void,
	) {}

	addHeaderColumn(table: HTMLTableElement): boolean {
		const headerRow = table.querySelector<HTMLTableRowElement>(
			APP_CONFIG.SELECTORS.TABLE_HEADER,
		);
		if (
			!headerRow ||
			headerRow.querySelector(`.${APP_CONFIG.CSS_CLASSES.HIDE_COLUMN}`)
		) {
			return false;
		}

		const th = document.createElement("th");
		th.className = APP_CONFIG.CSS_CLASSES.HIDE_COLUMN;
		th.textContent = "Hide Project";
		headerRow.appendChild(th);

		// Event delegation on table
		if (!table.dataset.augerPlusBound) {
			table.dataset.augerPlusBound = "true";
			table.addEventListener("click", (e) => {
				const btn = (e.target as HTMLElement)?.closest<HTMLButtonElement>(
					".auger-plus-hide-btn",
				);
				if (btn) {
					e.preventDefault();
					e.stopPropagation();
					const id = btn.getAttribute("data-project-id");
					if (id) {
						const name = btn.getAttribute("data-project-name") || id;
						this.onHide({ id, name });
					}
				}
			});
		}

		return true;
	}

	addRowHideButton(row: HTMLTableRowElement): boolean {
		if (row.querySelector(`.${APP_CONFIG.CSS_CLASSES.HIDE_CELL}`)) {
			return false;
		}

		const project = this.tableParser.parseRow(row);
		if (!project) return false;

		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "auger-plus-hide-btn";
		btn.textContent = "Hide";
		btn.setAttribute("data-project-id", project.id);
		btn.setAttribute("data-project-name", project.name);
		btn.setAttribute("aria-label", `Hide project ${project.name}`);

		btn.addEventListener("click", (e) => {
			e.preventDefault();
			e.stopPropagation();
			this.onHide({ id: project.id, name: project.name });
		});

		const cell = document.createElement("td");
		cell.className = APP_CONFIG.CSS_CLASSES.HIDE_CELL;
		cell.appendChild(btn);
		row.appendChild(cell);
		return true;
	}

	enhanceAllTables(container: ParentNode = document): number {
		const tables = container.querySelectorAll<HTMLTableElement>(
			APP_CONFIG.SELECTORS.TABLE,
		);
		let enhancedRows = 0;

		tables.forEach((table) => {
			this.addHeaderColumn(table);
			const rows = this.tableParser.getTableRows(table);
			rows.forEach((row) => {
				if (this.addRowHideButton(row)) enhancedRows++;
			});
		});

		return enhancedRows;
	}
}

/**
 * Generates and applies dynamic :has() CSS hiding rules
 */
export class DynamicStyleManager {
	private styleElement: HTMLStyleElement | null = null;
	private readonly styleId: string;

	constructor(styleId: string = APP_CONFIG.STYLE_ELEMENT_ID) {
		this.styleId = styleId;
	}

	escapeAttributeValue(value: string): string {
		return value.replace(/["\\]/g, "\\$&");
	}

	private getOrCreateStyleElement(): HTMLStyleElement {
		if (this.styleElement && document.contains(this.styleElement)) {
			return this.styleElement;
		}

		let el = document.getElementById(this.styleId) as HTMLStyleElement | null;
		if (!el) {
			el = document.createElement("style");
			el.id = this.styleId;
			document.head.appendChild(el);
		}

		this.styleElement = el;
		return el;
	}

	generateCssRules(projects: HiddenProject[]): string {
		if (projects.length === 0) return "";
		return projects
			.map(({ id }) => {
				const escaped = this.escapeAttributeValue(id);
				return `${APP_CONFIG.SELECTORS.TABLE} ${APP_CONFIG.SELECTORS.TABLE_BODY}:has(a[href*="${escaped}"]) { display: none !important; }`;
			})
			.join("\n");
	}

	applyHiddenStyles(projects: HiddenProject[]): void {
		const styleEl = this.getOrCreateStyleElement();
		styleEl.textContent = this.generateCssRules(projects);
	}

	destroy(): void {
		if (this.styleElement) {
			this.styleElement.remove();
			this.styleElement = null;
		}
	}
}

/**
 * Completely removes "(Page x of x)" and replaces with clean hidden count
 */
export class PaginationIndicator {
	constructor(private readonly tableParser: TableParser = new TableParser()) {}

	update(hiddenProjects: HiddenProject[], container: ParentNode = document): void {
		const indicator = container.querySelector<HTMLElement>(
			APP_CONFIG.SELECTORS.PAGINATION_INDICATOR,
		);
		if (!indicator) return;

		const hiddenIds = new Set(hiddenProjects.map((p) => p.id));
		const allRows = Array.from(
			container.querySelectorAll<HTMLTableRowElement>(
				`${APP_CONFIG.SELECTORS.TABLE} ${APP_CONFIG.SELECTORS.TABLE_BODY}`,
			),
		);

		let hiddenOnPage = 0;
		for (const row of allRows) {
			const projectId = this.tableParser.getProjectIdFromRow(row);
			if (projectId && hiddenIds.has(projectId)) {
				hiddenOnPage++;
			}
		}

		// Completely wipe out "(Page x of x)"
		indicator.innerHTML = "";

		if (hiddenOnPage > 0) {
			const visible = allRows.length - hiddenOnPage;
			const badge = document.createElement("span");
			badge.className = APP_CONFIG.CSS_CLASSES.PAGINATION_BADGE;
			badge.textContent = `${visible} shown, ${hiddenOnPage} hidden`;
			indicator.appendChild(badge);
			indicator.style.display = "";
		} else {
			indicator.style.display = "none";
		}
	}
}

/**
 * Loads all items across pages into a single continuous table view
 */
export class TableHarvester {
	private allRows = new Map<string, HTMLTableRowElement>();
	private isHarvesting = false;
	private hasLoadedAll = false;

	constructor(private readonly tableParser: TableParser = new TableParser()) {}

	findNextButton(container: ParentNode = document): HTMLElement | null {
		const candidates = Array.from(
			container.querySelectorAll<HTMLElement>(
				'button[aria-label*="next" i], a[aria-label*="next" i], [data-testid="pagination-next"]',
			),
		);
		for (const el of candidates) {
			if (!this.isDisabled(el)) return el;
		}
		return null;
	}

	isDisabled(el: HTMLElement): boolean {
		return (
			el.hasAttribute("disabled") ||
			el.classList.contains("disabled") ||
			el.getAttribute("aria-disabled") === "true"
		);
	}

	reset(): void {
		this.allRows.clear();
		this.hasLoadedAll = false;
		this.isHarvesting = false;
	}

	async loadAll(table: HTMLTableElement, onComplete?: () => void): Promise<void> {
		if (this.isHarvesting || this.hasLoadedAll) return;

		const nextBtn = this.findNextButton();
		if (!nextBtn || this.isDisabled(nextBtn)) {
			this.hasLoadedAll = true;
			return;
		}

		this.isHarvesting = true;
		try {
			const tbody = table.querySelector("tbody");
			if (!tbody) return;

			this.collectRows(tbody);

			let safety = 0;
			while (safety < 25) {
				safety++;
				const next = this.findNextButton();
				if (!next || this.isDisabled(next)) break;

				next.click();
				await new Promise((res) => setTimeout(res, 150));
				this.collectRows(tbody);
			}

			const existingIds = new Set(
				Array.from(tbody.querySelectorAll<HTMLTableRowElement>("tr"))
					.map((r) => this.tableParser.getProjectIdFromRow(r))
					.filter(Boolean),
			);

			for (const [id, row] of this.allRows) {
				if (!existingIds.has(id)) {
					tbody.appendChild(row.cloneNode(true));
					existingIds.add(id);
				}
			}

			this.hasLoadedAll = true;
			if (onComplete) onComplete();
		} finally {
			this.isHarvesting = false;
		}
	}

	collectRows(tbody: HTMLTableSectionElement): void {
		const rows = Array.from(tbody.querySelectorAll<HTMLTableRowElement>("tr"));
		for (const row of rows) {
			const id = this.tableParser.getProjectIdFromRow(row);
			if (id && !this.allRows.has(id)) {
				this.allRows.set(id, row.cloneNode(true) as HTMLTableRowElement);
			}
		}
	}
}

/**
 * Debounced MutationObserver for table container updates
 */
export class TableObserver {
	private observer: MutationObserver | null = null;
	private debounceTimer: ReturnType<typeof setTimeout> | null = null;

	constructor(private readonly debounceMs: number = APP_CONFIG.TIMINGS.DEBOUNCE_MS) {}

	observe(target: Node, onChange: () => void): void {
		this.disconnect();

		this.observer = new MutationObserver(() => {
			if (this.debounceTimer) clearTimeout(this.debounceTimer);
			this.debounceTimer = setTimeout(() => onChange(), this.debounceMs);
		});

		this.observer.observe(target, { childList: true, subtree: true });
	}

	disconnect(): void {
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
			this.debounceTimer = null;
		}
		if (this.observer) {
			this.observer.disconnect();
			this.observer = null;
		}
	}
}
