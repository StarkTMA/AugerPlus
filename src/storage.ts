import { APP_CONFIG } from "./constants";
import type { HiddenProject, IStorageService } from "./types";

export class ChromeStorageService implements IStorageService {
	private inMemoryFallback: HiddenProject[] = [];
	private listeners: Set<(projects: HiddenProject[]) => void> = new Set();
	private readonly storageKey: string;

	constructor(storageKey: string = APP_CONFIG.STORAGE_KEYS.HIDDEN_PROJECTS) {
		this.storageKey = storageKey;
		this.setupStorageListener();
	}

	private isChromeStorageAvailable(): boolean {
		return (
			typeof chrome !== "undefined" &&
			Boolean(chrome.storage) &&
			Boolean(chrome.storage.local)
		);
	}

	private setupStorageListener(): void {
		if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
			chrome.storage.onChanged.addListener((changes, areaName) => {
				if (areaName === "local" && changes[this.storageKey]) {
					const newProjects: HiddenProject[] =
						changes[this.storageKey]?.newValue || [];
					this.notifyListeners(newProjects);
				}
			});
		}
	}

	private notifyListeners(projects: HiddenProject[]): void {
		for (const listener of this.listeners) {
			try {
				listener(projects);
			} catch (err) {
				console.error("[AugerPlus] Error notifying storage listener:", err);
			}
		}
	}

	async getHiddenProjects(): Promise<HiddenProject[]> {
		if (!this.isChromeStorageAvailable()) {
			return [...this.inMemoryFallback];
		}

		return new Promise((resolve) => {
			chrome.storage.local.get([this.storageKey], (result) => {
				if (chrome.runtime.lastError) {
					console.error(
						"[AugerPlus] chrome.storage.local.get error:",
						chrome.runtime.lastError,
					);
					resolve([]);
					return;
				}
				const data = result[this.storageKey];
				resolve(Array.isArray(data) ? data : []);
			});
		});
	}

	async addHiddenProject(id: string, name: string): Promise<void> {
		const trimmedId = id.trim();
		if (!trimmedId) return;

		const current = await this.getHiddenProjects();
		if (current.some((p) => p.id === trimmedId)) {
			return;
		}

		const updated: HiddenProject[] = [
			...current,
			{
				id: trimmedId,
				name: name.trim() || trimmedId,
				hiddenAt: Date.now(),
			},
		];

		await this.save(updated);
	}

	async removeHiddenProject(id: string): Promise<void> {
		const trimmedId = id.trim();
		const current = await this.getHiddenProjects();
		const updated = current.filter((p) => p.id !== trimmedId);

		if (updated.length !== current.length) {
			await this.save(updated);
		}
	}

	async clearAll(): Promise<void> {
		await this.save([]);
	}

	private async save(projects: HiddenProject[]): Promise<void> {
		if (!this.isChromeStorageAvailable()) {
			this.inMemoryFallback = [...projects];
			this.notifyListeners(projects);
			return;
		}

		return new Promise((resolve, reject) => {
			chrome.storage.local.set({ [this.storageKey]: projects }, () => {
				if (chrome.runtime.lastError) {
					console.error(
						"[AugerPlus] chrome.storage.local.set error:",
						chrome.runtime.lastError,
					);
					reject(chrome.runtime.lastError);
					return;
				}
				resolve();
			});
		});
	}

	onChanged(callback: (projects: HiddenProject[]) => void): () => void {
		this.listeners.add(callback);
		return () => {
			this.listeners.delete(callback);
		};
	}
}
