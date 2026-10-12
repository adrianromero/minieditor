/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it, vi } from "vitest";
import { applyTypography, loadTypography, saveTypography } from "./TypographyPreferences";

describe("typography preferences", () => {
    it("defaults to the sans-serif typography", () => {
        const storage = { getItem: vi.fn(() => null) };

        expect(loadTypography(storage)).toBe("sans-serif");
    });

    it("restores every supported typography", () => {
        for (const typography of ["sans-serif", "serif", "modern", "reading"] as const) {
            const storage = { getItem: vi.fn(() => typography) };

            expect(loadTypography(storage)).toBe(typography);
        }
    });

    it("ignores an invalid stored typography", () => {
        const storage = { getItem: vi.fn(() => "unknown") };

        expect(loadTypography(storage)).toBe("sans-serif");
    });

    it("stores and applies a selected typography", () => {
        const storage = { setItem: vi.fn() };
        const root = document.createElement("div");

        saveTypography("reading", storage);
        applyTypography("reading", root);

        expect(storage.setItem).toHaveBeenCalledWith("minieditor.typography", "reading");
        expect(root.dataset.typography).toBe("reading");
    });
});
