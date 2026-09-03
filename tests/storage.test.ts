import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ChromeStorageService } from "../src/storage";
import { setupChromeMock } from "./chrome-mock";

describe("ChromeStorageService", () => {
	let mockEnv: ReturnType<typeof setupChromeMock>;

	beforeEach(() => {
		mockEnv = setupChromeMock();
	});

	afterEach(() => {
		mockEnv.clearMock();
	});

	it("manages hidden projects: add, retrieve, duplicate check, remove, clear", async () => {
		const service = new ChromeStorageService("test_storage");

		expect(await service.getHiddenProjects()).toEqual([]);

		await service.addHiddenProject(" p1 ", " Project 1 ");
		await service.addHiddenProject("p1", "Duplicate");
		let projects = await service.getHiddenProjects();
		expect(projects).toHaveLength(1);
		expect(projects[0]?.id).toBe("p1");
		expect(projects[0]?.name).toBe("Project 1");

		await service.addHiddenProject("p2", "Project 2");
		expect(await service.getHiddenProjects()).toHaveLength(2);

		await service.removeHiddenProject("p1");
		projects = await service.getHiddenProjects();
		expect(projects).toHaveLength(1);
		expect(projects[0]?.id).toBe("p2");

		await service.clearAll();
		expect(await service.getHiddenProjects()).toEqual([]);
	});

	it("notifies subscribers on change", async () => {
		const service = new ChromeStorageService("test_storage");
		const listener = vi.fn();
		const unsub = service.onChanged(listener);

		await service.addHiddenProject("p1", "P1");
		expect(listener).toHaveBeenCalledWith([expect.objectContaining({ id: "p1" })]);

		unsub();
		await service.addHiddenProject("p2", "P2");
		expect(listener).toHaveBeenCalledTimes(1);
	});
});
