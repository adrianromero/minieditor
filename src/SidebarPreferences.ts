/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

const SIDEBAR_VISIBLE_KEY = "plunibio.sidebarVisible";

type SidebarPreferenceReader = Pick<Storage, "getItem">;
type SidebarPreferenceWriter = Pick<Storage, "setItem">;

export function loadSidebarVisible(storage?: SidebarPreferenceReader): boolean {
    try {
        const value = (storage ?? window.localStorage).getItem(SIDEBAR_VISIBLE_KEY);
        if (value === "false") return false;
        return true;
    } catch (error: unknown) {
        console.error("Unable to load sidebar visibility:", error);
        return true;
    }
}

export function saveSidebarVisible(
    visible: boolean,
    storage?: SidebarPreferenceWriter
): void {
    try {
        (storage ?? window.localStorage).setItem(SIDEBAR_VISIBLE_KEY, String(visible));
    } catch (error: unknown) {
        console.error("Unable to save sidebar visibility:", error);
    }
}
