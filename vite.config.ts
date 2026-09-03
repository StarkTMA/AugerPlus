import { defineConfig, type Plugin } from "vitest/config";
import { resolve } from "path";
import fs from "fs";
import archiver from "archiver";

function extensionPackagerPlugin(): Plugin {
	return {
		name: "extension-packager",
		apply: "build",
		closeBundle: async () => {
			const distDir = resolve(__dirname, "dist");
			if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

			// Copy manifest.json
			const manifestSrc = resolve(__dirname, "manifest.json");
			if (fs.existsSync(manifestSrc)) {
				fs.copyFileSync(manifestSrc, resolve(distDir, "manifest.json"));
			}

			// Copy images
			const imagesSrc = resolve(__dirname, "images");
			const imagesDist = resolve(distDir, "images");
			if (fs.existsSync(imagesSrc)) {
				if (!fs.existsSync(imagesDist))
					fs.mkdirSync(imagesDist, { recursive: true });
				for (const file of fs.readdirSync(imagesSrc)) {
					fs.copyFileSync(
						resolve(imagesSrc, file),
						resolve(imagesDist, file),
					);
				}
			}

			// Copy styles.css
			const stylesSrc = resolve(__dirname, "src/styles.css");
			if (fs.existsSync(stylesSrc)) {
				fs.copyFileSync(stylesSrc, resolve(distDir, "styles.css"));
			}

			// Create ZIP archive inside dist
			const manifest = JSON.parse(fs.readFileSync(manifestSrc, "utf8"));
			const version = manifest.version || "2.0.0";
			const zipPath = resolve(distDir, `auger-plus-v${version}.zip`);

			const output = fs.createWriteStream(zipPath);
			const archive = archiver("zip", { zlib: { level: 9 } });

			await new Promise<void>((res, rej) => {
				output.on("close", () => {
					const sizeKb = (archive.pointer() / 1024).toFixed(2);
					console.log(
						`[AugerPlus] Built & packaged: auger-plus-v${version}.zip (${sizeKb} KB)`,
					);
					res();
				});
				archive.on("error", rej);
				archive.pipe(output);

				// Include dist files except the zip itself
				archive.file(resolve(distDir, "manifest.json"), {
					name: "manifest.json",
				});
				archive.file(resolve(distDir, "content.js"), { name: "content.js" });
				archive.file(resolve(distDir, "styles.css"), { name: "styles.css" });
				archive.directory(imagesDist, "images");
				archive.finalize();
			});
		},
	};
}

export default defineConfig({
	build: {
		outDir: "dist",
		emptyOutDir: true,
		sourcemap: false,
		rollupOptions: {
			input: {
				content: resolve(__dirname, "src/content.ts"),
			},
			output: {
				entryFileNames: "[name].js",
				format: "iife",
				name: "AugerPlus",
			},
		},
	},
	plugins: [extensionPackagerPlugin()],
	test: {
		environment: "happy-dom",
		globals: true,
		include: ["tests/**/*.test.ts"],
	},
});
