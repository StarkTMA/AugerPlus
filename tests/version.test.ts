import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { VersionChecker } from "../src/version";
import { setupChromeMock } from "./chrome-mock";

describe("VersionChecker", () => {
	let mockEnv: ReturnType<typeof setupChromeMock>;
	let checker: VersionChecker;

	beforeEach(() => {
		mockEnv = setupChromeMock();
		checker = new VersionChecker("owner", "repo", 1000);
	});

	afterEach(() => {
		mockEnv.clearMock();
		vi.restoreAllMocks();
	});

	it("compares semver versions accurately", () => {
		expect(checker.isNewerVersion("2.0.0", "2.0.1")).toBe(true);
		expect(checker.isNewerVersion("2.0.0", "2.1.0")).toBe(true);
		expect(checker.isNewerVersion("2.0.0", "3.0.0")).toBe(true);
		expect(checker.isNewerVersion("2.0.0", "2.0.0")).toBe(false);
		expect(checker.isNewerVersion("2.1.0", "2.0.9")).toBe(false);
	});

	it("checks GitHub release and uses cache", async () => {
		const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
			ok: true,
			json: async () => ({ tag_name: "v2.1.0", html_url: "https://github.com" }),
		} as Response);

		const first = await checker.checkForUpdate();
		expect(first.hasUpdate).toBe(true);
		expect(fetchSpy).toHaveBeenCalledTimes(1);

		const second = await checker.checkForUpdate();
		expect(second.hasUpdate).toBe(true);
		expect(fetchSpy).toHaveBeenCalledTimes(1);
	});
});
