/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

export type AppTheme = "light" | "dark";

const THEME_KEY = "plunibio.theme";

type ThemePreferenceReader = Pick<Storage, "getItem">;
type ThemePreferenceWriter = Pick<Storage, "setItem">;

export function loadTheme(storage?: ThemePreferenceReader): AppTheme {
    try {
        return (storage ?? window.localStorage).getItem(THEME_KEY) === "dark" ? "dark" : "light";
    } catch (error: unknown) {
        console.error("Unable to load theme:", error);
        return "light";
    }
}

export function saveTheme(theme: AppTheme, storage?: ThemePreferenceWriter): void {
    try {
        (storage ?? window.localStorage).setItem(THEME_KEY, theme);
    } catch (error: unknown) {
        console.error("Unable to save theme:", error);
    }
}

export function applyTheme(theme: AppTheme, root: HTMLElement = document.documentElement): void {
    root.dataset.theme = theme;
}
