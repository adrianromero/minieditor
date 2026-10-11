/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { applyTheme, loadTheme, saveTheme } from "./ThemePreferences";

describe("theme preferences", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("defaults to the light theme", () => {
        expect(loadTheme({ getItem: vi.fn(() => null) })).toBe("light");
        expect(loadTheme({ getItem: vi.fn(() => "invalid") })).toBe("light");
    });

    it("restores and stores the dark theme", () => {
        const writer = { setItem: vi.fn() };

        expect(loadTheme({ getItem: vi.fn(() => "dark") })).toBe("dark");
        saveTheme("dark", writer);

        expect(writer.setItem).toHaveBeenCalledWith("minieditor.theme", "dark");
    });

    it("applies the theme to the supplied root", () => {
        const root = document.createElement("div");

        applyTheme("dark", root);

        expect(root.dataset.theme).toBe("dark");
    });

    it("falls back safely when storage is unavailable", () => {
        const error = new Error("storage unavailable");
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
        const reader = { getItem: vi.fn(() => { throw error; }) };
        const writer = { setItem: vi.fn(() => { throw error; }) };

        expect(loadTheme(reader)).toBe("light");
        expect(() => saveTheme("dark", writer)).not.toThrow();
        expect(consoleError).toHaveBeenCalledTimes(2);
    });
});
