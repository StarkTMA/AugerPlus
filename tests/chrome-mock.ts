export function setupChromeMock() {
	const store: Record<string, any> = {};
	const listeners: Array<
		(
			changes: Record<string, chrome.storage.StorageChange>,
			areaName: string,
		) => void
	> = [];

	const chromeMock = {
		runtime: {
			lastError: null as any,
			getManifest: () => ({
				version: "2.0.0",
				name: "AugerPlus",
				manifest_version: 3,
			}),
		},
		storage: {
			local: {
				get: (
					keys: string[] | string | null,
					callback: (items: Record<string, any>) => void,
				) => {
					const result: Record<string, any> = {};
					if (Array.isArray(keys)) {
						for (const k of keys) {
							if (k in store) result[k] = store[k];
						}
					} else if (typeof keys === "string") {
						if (keys in store) result[keys] = store[keys];
					} else if (keys === null) {
						Object.assign(result, store);
					}
					callback(result);
				},
				set: (items: Record<string, any>, callback?: () => void) => {
					const changes: Record<string, chrome.storage.StorageChange> = {};
					for (const [k, val] of Object.entries(items)) {
						changes[k] = { oldValue: store[k], newValue: val };
						store[k] = val;
					}
					for (const listener of listeners) {
						listener(changes, "local");
					}
					if (callback) callback();
				},
				remove: (keys: string | string[], callback?: () => void) => {
					const keyList = Array.isArray(keys) ? keys : [keys];
					for (const k of keyList) delete store[k];
					if (callback) callback();
				},
				clear: (callback?: () => void) => {
					for (const k of Object.keys(store)) delete store[k];
					if (callback) callback();
				},
			},
			onChanged: {
				addListener: (
					fn: (
						changes: Record<string, chrome.storage.StorageChange>,
						areaName: string,
					) => void,
				) => {
					listeners.push(fn);
				},
				removeListener: (
					fn: (
						changes: Record<string, chrome.storage.StorageChange>,
						areaName: string,
					) => void,
				) => {
					const idx = listeners.indexOf(fn);
					if (idx !== -1) listeners.splice(idx, 1);
				},
			},
		},
	};

	(globalThis as any).chrome = chromeMock;

	return {
		store,
		clearMock: () => {
			for (const k of Object.keys(store)) delete store[k];
			listeners.length = 0;
		},
	};
}
