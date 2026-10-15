/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

const SHOW_HIDDEN_FILES_KEY = "plunibio.showHiddenFiles";

type HiddenFilesPreferenceReader = Pick<Storage, "getItem">;
type HiddenFilesPreferenceWriter = Pick<Storage, "setItem">;

export function loadShowHiddenFiles(storage?: HiddenFilesPreferenceReader): boolean {
    try {
        return (storage ?? window.localStorage).getItem(SHOW_HIDDEN_FILES_KEY) === "true";
    } catch (error: unknown) {
        console.error("Unable to load hidden files visibility:", error);
        return false;
    }
}

export function saveShowHiddenFiles(
    visible: boolean,
    storage?: HiddenFilesPreferenceWriter
): void {
    try {
        (storage ?? window.localStorage).setItem(SHOW_HIDDEN_FILES_KEY, String(visible));
    } catch (error: unknown) {
        console.error("Unable to save hidden files visibility:", error);
    }
}
