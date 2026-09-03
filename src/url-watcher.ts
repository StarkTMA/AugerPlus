export class UrlWatcher {
	private lastUrl: string;
	private timer: ReturnType<typeof setInterval> | null = null;
	private origPushState: typeof history.pushState | null = null;
	private origReplaceState: typeof history.replaceState | null = null;
	private popListener: (() => void) | null = null;

	constructor(private readonly onUrlChanged: () => void) {
		this.lastUrl = typeof location !== "undefined" ? location.href : "";
	}

	start(): void {
		if (typeof window === "undefined") return;

		this.lastUrl = location.href;

		this.origPushState = history.pushState;
		history.pushState = (...args) => {
			this.origPushState?.apply(history, args);
			this.checkUrl();
		};

		this.origReplaceState = history.replaceState;
		history.replaceState = (...args) => {
			this.origReplaceState?.apply(history, args);
			this.checkUrl();
		};

		this.popListener = () => this.checkUrl();
		window.addEventListener("popstate", this.popListener);

		this.timer = setInterval(() => this.checkUrl(), 500);
	}

	private checkUrl(): void {
		if (typeof location === "undefined") return;
		if (location.href !== this.lastUrl) {
			this.lastUrl = location.href;
			this.onUrlChanged();
		}
	}

	stop(): void {
		if (this.timer) {
			clearInterval(this.timer);
			this.timer = null;
		}
		if (this.popListener && typeof window !== "undefined") {
			window.removeEventListener("popstate", this.popListener);
			this.popListener = null;
		}
		if (this.origPushState && typeof history !== "undefined") {
			history.pushState = this.origPushState;
			this.origPushState = null;
		}
		if (this.origReplaceState && typeof history !== "undefined") {
			history.replaceState = this.origReplaceState;
			this.origReplaceState = null;
		}
	}
}
