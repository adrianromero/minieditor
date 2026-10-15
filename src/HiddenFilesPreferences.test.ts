/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { loadShowHiddenFiles, saveShowHiddenFiles } from "./HiddenFilesPreferences";

describe("hidden files preferences", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("defaults to hiding hidden files", () => {
        expect(loadShowHiddenFiles({ getItem: vi.fn(() => null) })).toBe(false);
        expect(loadShowHiddenFiles({ getItem: vi.fn(() => "invalid") })).toBe(false);
    });

    it("restores and stores hidden file visibility", () => {
        const writer = { setItem: vi.fn() };

        expect(loadShowHiddenFiles({ getItem: vi.fn(() => "true") })).toBe(true);
        saveShowHiddenFiles(true, writer);

        expect(writer.setItem).toHaveBeenCalledWith("plunibio.showHiddenFiles", "true");
    });

    it("falls back safely when storage is unavailable", () => {
        const error = new Error("storage unavailable");
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
        const reader = { getItem: vi.fn(() => { throw error; }) };
        const writer = { setItem: vi.fn(() => { throw error; }) };

        expect(loadShowHiddenFiles(reader)).toBe(false);
        expect(() => saveShowHiddenFiles(true, writer)).not.toThrow();
        expect(consoleError).toHaveBeenCalledTimes(2);
    });
});
