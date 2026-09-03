export interface HiddenProject {
	id: string;
	name: string;
	hiddenAt: number;
}

export interface ProjectRowInfo {
	id: string;
	name: string;
	rowElement: HTMLTableRowElement;
}

export interface IStorageService {
	getHiddenProjects(): Promise<HiddenProject[]>;
	addHiddenProject(id: string, name: string): Promise<void>;
	removeHiddenProject(id: string): Promise<void>;
	clearAll(): Promise<void>;
	onChanged(callback: (projects: HiddenProject[]) => void): () => void;
}

export interface VersionCheckResult {
	hasUpdate: boolean;
	currentVersion: string;
	latestVersion: string;
	releaseUrl?: string;
}

export interface IVersionChecker {
	checkForUpdate(): Promise<VersionCheckResult>;
}
