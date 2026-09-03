import { AugerPlusApp } from "./app";

const app = new AugerPlusApp();

function start(): void {
	app.initialize().catch((err) => {
		console.error("[AugerPlus] Failed to initialize:", err);
	});
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", start);
} else {
	start();
}

window.addEventListener("beforeunload", () => {
	app.destroy();
});
