import { ChromeStorageService } from "./storage";
import {
	TableParser,
	TableEnhancer,
	DynamicStyleManager,
	PaginationIndicator,
	TableObserver,
	TableHarvester,
} from "./table";
import { UnhideButton, UnhideModal, NotificationToast } from "./ui";
import { VersionChecker } from "./version";
import { UrlWatcher } from "./url-watcher";
import type { IStorageService, IVersionChecker, HiddenProject } from "./types";

export interface AppDependencies {
	storageService?: IStorageService;
	styleManager?: DynamicStyleManager;
	tableParser?: TableParser;
	tableEnhancer?: TableEnhancer;
	paginationIndicator?: PaginationIndicator;
	tableHarvester?: TableHarvester;
	unhideButton?: UnhideButton;
	unhideModal?: UnhideModal;
	tableObserver?: TableObserver;
	urlWatcher?: UrlWatcher;
	versionChecker?: IVersionChecker;
	notificationToast?: NotificationToast;
}

export class AugerPlusApp {
	readonly storageService: IStorageService;
	readonly styleManager: DynamicStyleManager;
	readonly tableParser: TableParser;
	readonly tableEnhancer: TableEnhancer;
	readonly paginationIndicator: PaginationIndicator;
	readonly tableHarvester: TableHarvester;
	readonly unhideButton: UnhideButton;
	readonly unhideModal: UnhideModal;
	readonly tableObserver: TableObserver;
	readonly urlWatcher: UrlWatcher;
	readonly versionChecker: IVersionChecker;
	readonly notificationToast: NotificationToast;

	private isInitialized = false;
	private unsubscribeStorage: (() => void) | null = null;
	private currentHiddenProjects: HiddenProject[] = [];

	constructor(deps: AppDependencies = {}) {
		this.storageService = deps.storageService ?? new ChromeStorageService();
		this.styleManager = deps.styleManager ?? new DynamicStyleManager();
		this.tableParser = deps.tableParser ?? new TableParser();
		this.tableEnhancer =
			deps.tableEnhancer ??
			new TableEnhancer(this.tableParser, (project) =>
				this.handleHideProject(project),
			);
		this.paginationIndicator =
			deps.paginationIndicator ?? new PaginationIndicator(this.tableParser);
		this.tableHarvester =
			deps.tableHarvester ?? new TableHarvester(this.tableParser);
		this.unhideButton =
			deps.unhideButton ?? new UnhideButton(() => this.handleOpenModal());
		this.unhideModal =
			deps.unhideModal ??
			new UnhideModal({
				onUnhide: (id) => this.handleUnhideProject(id),
				onUnhideAll: () => this.handleUnhideAll(),
			});
		this.tableObserver = deps.tableObserver ?? new TableObserver();
		this.urlWatcher =
			deps.urlWatcher ??
			new UrlWatcher(() => {
				this.tableHarvester.reset();
				this.syncPage();
			});
		this.versionChecker = deps.versionChecker ?? new VersionChecker();
		this.notificationToast = deps.notificationToast ?? new NotificationToast();
	}

	async initialize(): Promise<void> {
		if (this.isInitialized) return;

		this.currentHiddenProjects = await this.storageService.getHiddenProjects();
		this.styleManager.applyHiddenStyles(this.currentHiddenProjects);

		this.unsubscribeStorage = this.storageService.onChanged((projects) => {
			this.currentHiddenProjects = projects;
			this.styleManager.applyHiddenStyles(projects);
			this.paginationIndicator.update(projects);
			if (this.unhideModal.isOpen()) {
				this.unhideModal.refresh(projects);
			}
		});

		this.syncPage();

		if (typeof document !== "undefined" && document.body) {
			this.tableObserver.observe(document.body, () => this.syncPage());
		}

		this.urlWatcher.start();
		this.checkVersionUpdate();
		this.isInitialized = true;
	}

	syncPage(): void {
		this.unhideButton.mount();
		this.tableEnhancer.enhanceAllTables();
		this.paginationIndicator.update(this.currentHiddenProjects);

		if (typeof document !== "undefined") {
			const table = document.querySelector<HTMLTableElement>("table.table");
			if (table) {
				this.tableHarvester.loadAll(table, () => {
					this.tableEnhancer.enhanceAllTables();
					this.paginationIndicator.update(this.currentHiddenProjects);
				});
			}
		}
	}

	async handleHideProject(project: { id: string; name: string }): Promise<void> {
		await this.storageService.addHiddenProject(project.id, project.name);
		this.syncPage();
	}

	async handleUnhideProject(projectId: string): Promise<void> {
		await this.storageService.removeHiddenProject(projectId);
		this.syncPage();
	}

	async handleUnhideAll(): Promise<void> {
		await this.storageService.clearAll();
		this.syncPage();
	}

	async handleOpenModal(): Promise<void> {
		const projects = await this.storageService.getHiddenProjects();
		this.currentHiddenProjects = projects;
		this.unhideModal.open(projects);
	}

	private async checkVersionUpdate(): Promise<void> {
		try {
			const result = await this.versionChecker.checkForUpdate();
			if (result.hasUpdate) {
				this.notificationToast.show(
					result.latestVersion,
					result.currentVersion,
				);
			}
		} catch (err) {
			console.warn("[AugerPlus] Version check failed:", err);
		}
	}

	destroy(): void {
		this.tableObserver.disconnect();
		this.urlWatcher.stop();
		this.unhideModal.close();
		this.notificationToast.dismiss();
		this.styleManager.destroy();

		if (this.unsubscribeStorage) {
			this.unsubscribeStorage();
			this.unsubscribeStorage = null;
		}
		this.isInitialized = false;
	}
}
