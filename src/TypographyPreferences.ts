/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

export const APP_TYPOGRAPHIES = ["sans-serif", "serif", "modern", "reading"] as const;
export type AppTypography = (typeof APP_TYPOGRAPHIES)[number];

const TYPOGRAPHY_KEY = "minieditor.typography";

type TypographyPreferenceReader = Pick<Storage, "getItem">;
type TypographyPreferenceWriter = Pick<Storage, "setItem">;
type TypographyPreferenceStorage = TypographyPreferenceReader
    & Partial<TypographyPreferenceWriter>;

export function isAppTypography(value: string | null): value is AppTypography {
    return APP_TYPOGRAPHIES.some(typography => typography === value);
}

export function loadTypography(storage?: TypographyPreferenceStorage): AppTypography {
    const preferenceStorage = storage ?? window.localStorage;

    try {
        const storedTypography = preferenceStorage.getItem(TYPOGRAPHY_KEY);
        if (storedTypography === "book") {
            try {
                preferenceStorage.setItem?.(TYPOGRAPHY_KEY, "reading");
            } catch (error: unknown) {
                console.error("Unable to migrate typography:", error);
            }
            return "reading";
        }
        return isAppTypography(storedTypography) ? storedTypography : "sans-serif";
    } catch (error: unknown) {
        console.error("Unable to load typography:", error);
        return "sans-serif";
    }
}

export function saveTypography(
    typography: AppTypography,
    storage?: TypographyPreferenceWriter
): void {
    try {
        (storage ?? window.localStorage).setItem(TYPOGRAPHY_KEY, typography);
    } catch (error: unknown) {
        console.error("Unable to save typography:", error);
    }
}

export function applyTypography(
    typography: AppTypography,
    root: HTMLElement = document.documentElement
): void {
    root.dataset.typography = typography;
}
