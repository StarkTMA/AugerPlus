import { APP_CONFIG } from "./constants";
import type { IVersionChecker, VersionCheckResult } from "./types";

interface VersionCacheEntry {
	timestamp: number;
	latestVersion: string;
	releaseUrl?: string;
}

export class VersionChecker implements IVersionChecker {
	constructor(
		private readonly owner: string = APP_CONFIG.UPDATE_CHECK.GITHUB_REPO_OWNER,
		private readonly repo: string = APP_CONFIG.UPDATE_CHECK.GITHUB_REPO_NAME,
		private readonly cacheDurationMs: number = APP_CONFIG.UPDATE_CHECK
			.CACHE_DURATION_MS,
	) {}

	getCurrentVersion(): string {
		if (typeof chrome !== "undefined" && chrome.runtime?.getManifest) {
			return chrome.runtime.getManifest()?.version || "2.0.0";
		}
		return "2.0.0";
	}

	isNewerVersion(currentVersion: string, remoteVersion: string): boolean {
		const cleanCurrent = currentVersion.replace(/^v/i, "").trim();
		const cleanRemote = remoteVersion.replace(/^v/i, "").trim();

		if (cleanCurrent === cleanRemote) return false;

		const currentParts = cleanCurrent.split(".").map((p) => parseInt(p, 10) || 0);
		const remoteParts = cleanRemote.split(".").map((p) => parseInt(p, 10) || 0);
		const maxLength = Math.max(currentParts.length, remoteParts.length);

		for (let i = 0; i < maxLength; i++) {
			const curr = currentParts[i] ?? 0;
			const remote = remoteParts[i] ?? 0;
			if (remote > curr) return true;
			if (remote < curr) return false;
		}

		return false;
	}

	private async getCachedVersion(): Promise<VersionCacheEntry | null> {
		try {
			if (typeof chrome !== "undefined" && chrome.storage?.local) {
				const key = APP_CONFIG.STORAGE_KEYS.VERSION_CACHE;
				return new Promise((resolve) => {
					chrome.storage.local.get([key], (res) => {
						const data = res[key] as VersionCacheEntry | undefined;
						if (
							data &&
							typeof data.timestamp === "number" &&
							typeof data.latestVersion === "string"
						) {
							resolve(data);
						} else {
							resolve(null);
						}
					});
				});
			}
		} catch {
			// Fallback
		}
		return null;
	}

	private async setCachedVersion(entry: VersionCacheEntry): Promise<void> {
		try {
			if (typeof chrome !== "undefined" && chrome.storage?.local) {
				const key = APP_CONFIG.STORAGE_KEYS.VERSION_CACHE;
				await new Promise<void>((resolve) => {
					chrome.storage.local.set({ [key]: entry }, () => resolve());
				});
			}
		} catch {
			// Fallback
		}
	}

	async checkForUpdate(): Promise<VersionCheckResult> {
		const currentVersion = this.getCurrentVersion();

		try {
			const cached = await this.getCachedVersion();
			if (cached && Date.now() - cached.timestamp < this.cacheDurationMs) {
				const hasUpdate = this.isNewerVersion(
					currentVersion,
					cached.latestVersion,
				);
				return {
					hasUpdate,
					currentVersion,
					latestVersion: cached.latestVersion,
					releaseUrl: cached.releaseUrl,
				};
			}

			const apiUrl = `https://api.github.com/repos/${this.owner}/${this.repo}/releases/latest`;
			const response = await fetch(apiUrl, {
				headers: { Accept: "application/vnd.github.v3+json" },
			});

			if (!response.ok) {
				return {
					hasUpdate: false,
					currentVersion,
					latestVersion: currentVersion,
				};
			}

			const release = (await response.json()) as {
				tag_name?: string;
				html_url?: string;
			};
			const latestTag = release.tag_name || "";
			const latestVersion = latestTag.replace(/^v/i, "").trim();

			if (!latestVersion) {
				return {
					hasUpdate: false,
					currentVersion,
					latestVersion: currentVersion,
				};
			}

			await this.setCachedVersion({
				timestamp: Date.now(),
				latestVersion,
				releaseUrl: release.html_url,
			});

			const hasUpdate = this.isNewerVersion(currentVersion, latestVersion);
			return {
				hasUpdate,
				currentVersion,
				latestVersion,
				releaseUrl: release.html_url,
			};
		} catch {
			return { hasUpdate: false, currentVersion, latestVersion: currentVersion };
		}
	}
}
