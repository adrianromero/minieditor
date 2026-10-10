/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { loadSidebarVisible, saveSidebarVisible } from "./SidebarPreferences";

describe("sidebar preferences", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("defaults to visible when no preference has been saved", () => {
        const storage = { getItem: vi.fn(() => null) };

        expect(loadSidebarVisible(storage)).toBe(true);
    });

    it("restores a hidden sidebar", () => {
        const storage = { getItem: vi.fn(() => "false") };

        expect(loadSidebarVisible(storage)).toBe(false);
    });

    it("treats unknown values as visible", () => {
        const storage = { getItem: vi.fn(() => "invalid") };

        expect(loadSidebarVisible(storage)).toBe(true);
    });

    it("stores visibility as a boolean string", () => {
        const storage = { setItem: vi.fn() };

        saveSidebarVisible(false, storage);

        expect(storage.setItem).toHaveBeenCalledWith("minieditor.sidebarVisible", "false");
    });

    it("falls back safely when storage is unavailable", () => {
        const error = new Error("storage unavailable");
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
        const reader = {
            getItem: vi.fn(() => {
                throw error;
            }),
        };
        const writer = {
            setItem: vi.fn(() => {
                throw error;
            }),
        };

        expect(loadSidebarVisible(reader)).toBe(true);
        expect(() => saveSidebarVisible(true, writer)).not.toThrow();
        expect(consoleError).toHaveBeenCalledTimes(2);
    });
});
