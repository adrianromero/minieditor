/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it, vi } from "vitest";
import { getSystemLocale, loadLocale, saveLocale } from "./LocalePreferences";

const systemLocale = (language: string, languages: readonly string[] = [language]) => ({
    language,
    languages,
});

describe("locale preferences", () => {
    it("uses a supported system locale when there is no saved preference", () => {
        const storage = { getItem: vi.fn(() => null) };

        expect(loadLocale(storage, systemLocale("es-ES"))).toBe("es");
        expect(loadLocale(storage, systemLocale("ca-ES"))).toBe("ca");
        expect(loadLocale(storage, systemLocale("gl-ES"))).toBe("gl");
        expect(loadLocale(storage, systemLocale("eu-ES"))).toBe("eu");
        expect(loadLocale(storage, systemLocale("fr-FR"))).toBe("en");
    });

    it("restores a saved locale instead of the system locale", () => {
        const storage = { getItem: vi.fn(() => "en") };

        expect(loadLocale(storage, systemLocale("es-ES"))).toBe("en");
    });

    it("ignores an invalid saved locale", () => {
        const storage = { getItem: vi.fn(() => "fr") };

        expect(loadLocale(storage, systemLocale("es-ES"))).toBe("es");
    });

    it("stores a selected locale", () => {
        const storage = { setItem: vi.fn() };

        saveLocale("es", storage);

        expect(storage.setItem).toHaveBeenCalledWith("minieditor.locale", "es");
    });

    it("prefers the first locale in the system language list", () => {
        expect(getSystemLocale(systemLocale("en-US", ["es-MX", "en-US"]))).toBe("es");
    });
});
