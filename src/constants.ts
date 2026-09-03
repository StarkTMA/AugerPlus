export const APP_CONFIG = {
	STORAGE_KEYS: {
		HIDDEN_PROJECTS: "auger_plus_hidden_projects",
		VERSION_CACHE: "auger_plus_version_cache",
	},
	UPDATE_CHECK: {
		GITHUB_REPO_OWNER: "StarkTMA",
		GITHUB_REPO_NAME: "AugerPlus",
		CACHE_DURATION_MS: 6 * 60 * 60 * 1000, // 6 hours
		TOAST_DISPLAY_MS: 8000,
	},
	TIMINGS: {
		DEBOUNCE_MS: 50,
	},
	SELECTORS: {
		TABLE: "table.table",
		TABLE_HEADER: "thead tr",
		TABLE_BODY: "tbody tr",
		TABLE_CELL: "td",
		CONTENT_CENTER: ".content-select-center",
		PAGINATION_INDICATOR: '[data-testid="pagination-indicator"]',
	},
	CSS_CLASSES: {
		HIDE_COLUMN: "auger-plus-hide-column",
		HIDE_CELL: "auger-plus-hide-cell",
		SHOW_HIDDEN_BTN: "auger-plus-show-hidden-btn",
		MODAL_BACKDROP: "auger-plus-modal-backdrop",
		MODAL_BOX: "auger-plus-modal-box",
		UPDATE_TOAST: "auger-plus-update-toast",
		PAGINATION_BADGE: "auger-plus-hidden-badge",
	},
	STYLE_ELEMENT_ID: "auger-plus-dynamic-styles",
} as const;
