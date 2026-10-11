/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { createSignal, type Accessor, type Setter } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AppContextValues, ReloadFileHandler, SaveFileHandler } from "./AppContext";
import Toolbar from "./Toolbar";
import type { Locale } from "./Localization";
import type { AppTheme } from "./ThemePreferences";

let editorContext: AppContextValues["editor"];
let locale: Accessor<Locale>;
let setLocale: Setter<Locale>;

vi.mock("./AppContext", () => ({
    useAppContext: () => ({ editor: editorContext }),
}));

vi.mock("./Localization", () => ({
    useI18N: () => ({ t: (key: string) => key, locale, setLocale }),
}));

vi.mock("./FileNavigation", () => ({ default: () => null }));
vi.mock("./FileBreadcrumb", () => ({ default: () => null }));

describe("Toolbar", () => {
    let dispose: (() => void) | undefined;
    let setSaveFile: (handler: SaveFileHandler | null) => void;
    let setReloadFile: (handler: ReloadFileHandler | null) => void;
    let setToggleSidebar: AppContextValues["editor"]["setToggleSidebar"];
    let setSidebarVisible: (visible: boolean) => void;
    let setFileModified: (modified: boolean) => void;
    let setTheme: (theme: AppTheme) => void;

    beforeEach(() => {
        const [saveFile, setSaveFileSignal] = createSignal<SaveFileHandler | null>(null);
        const [reloadFile, setReloadFileSignal] = createSignal<ReloadFileHandler | null>(null);
        const [toggleSidebar, setToggleSidebarSignal] =
            createSignal<ReturnType<AppContextValues["editor"]["toggleSidebar"]>>(null);
        const [sidebarVisible, setSidebarVisibleSignal] = createSignal(true);
        const [fileModified, setFileModifiedSignal] = createSignal(false);
        const [theme, setThemeSignal] = createSignal<AppTheme>("light");
        [locale, setLocale] = createSignal<Locale>("en");
        setSaveFile = (handler) => setSaveFileSignal(() => handler);
        setReloadFile = (handler) => setReloadFileSignal(() => handler);
        setToggleSidebar = (handler) => setToggleSidebarSignal(() => handler);
        setSidebarVisible = setSidebarVisibleSignal;
        setFileModified = setFileModifiedSignal;
        setTheme = setThemeSignal;

        editorContext = {
            saveFile,
            setSaveFile,
            reloadFile,
            setReloadFile,
            searchFile: () => null,
            setSearchFile: vi.fn(),
            sidebarVisible,
            setSidebarVisible: setSidebarVisibleSignal,
            toggleSidebar,
            setToggleSidebar,
            theme,
            setTheme: setThemeSignal,
            toggleTheme: () => setThemeSignal((current) => current === "light" ? "dark" : "light"),
            fileModified,
            setFileModified: setFileModifiedSignal,
        };
    });

    afterEach(() => {
        dispose?.();
        dispose = undefined;
        document.body.replaceChildren();
    });

    it("only shows Save when a save handler is available", () => {
        const root = document.createElement("div");
        document.body.append(root);
        dispose = render(() => <Toolbar />, root);

        expect(root.querySelector('[aria-label="toolbar.save"]')).toBeNull();

        setReloadFile(() => Promise.resolve());

        expect(root.querySelector('[aria-label="toolbar.save"]')).toBeNull();

        const save = vi.fn(() => Promise.resolve());
        setSaveFile(save);
        const saveButton = root.querySelector<HTMLButtonElement>('[aria-label="toolbar.save"]');
        expect(saveButton).not.toBeNull();
        expect(saveButton?.disabled).toBe(true);

        setFileModified(true);
        expect(saveButton?.disabled).toBe(false);
        expect(root.querySelector('[aria-label="toolbar.unsavedChanges"]')).not.toBeNull();

        saveButton?.click();
        expect(save).toHaveBeenCalledOnce();
    });

    it("shows the registered sidebar toggle before the action separator", () => {
        const root = document.createElement("div");
        document.body.append(root);
        dispose = render(() => <Toolbar />, root);

        expect(root.querySelector('[aria-label="toolbar.hideSidebar"]')).toBeNull();

        const toggle = vi.fn(() => setSidebarVisible(false));
        setToggleSidebar(toggle);

        const button = root.querySelector<HTMLButtonElement>(
            '[aria-label="toolbar.hideSidebar"]'
        );
        expect(button?.classList.contains("selected")).toBe(true);
        expect(button?.getAttribute("aria-pressed")).toBe("true");
        expect(button?.nextElementSibling?.getAttribute("aria-hidden")).toBe("true");

        button?.click();

        expect(toggle).toHaveBeenCalledOnce();
        expect(button?.classList.contains("selected")).toBe(false);
        expect(button?.getAttribute("aria-label")).toBe("toolbar.showSidebar");
        expect(button?.getAttribute("aria-pressed")).toBe("false");
    });

    it("selects the application theme from the nested choice menu", () => {
        const root = document.createElement("div");
        document.body.append(root);
        dispose = render(() => <Toolbar />, root);

        expect(root.querySelector('[aria-label="toolbar.useDarkTheme"]')).toBeNull();

        const themeEntry = root.querySelector<HTMLButtonElement>(
            '[data-toolbar-menu-entry="theme"]'
        );
        const light = root.querySelector<HTMLButtonElement>('[data-choice-option="light"]');
        const dark = root.querySelector<HTMLButtonElement>('[data-choice-option="dark"]');

        expect(themeEntry?.textContent).toContain("toolbar.lightTheme");
        expect(light?.getAttribute("aria-checked")).toBe("true");
        expect(dark?.getAttribute("aria-checked")).toBe("false");

        dark?.click();

        expect(themeEntry?.textContent).toContain("toolbar.darkTheme");
        expect(light?.getAttribute("aria-checked")).toBe("false");
        expect(dark?.getAttribute("aria-checked")).toBe("true");

        setTheme("light");
        expect(themeEntry?.textContent).toContain("toolbar.lightTheme");
    });

    it("selects the application language from the nested choice menu", () => {
        const root = document.createElement("div");
        document.body.append(root);
        dispose = render(() => <Toolbar />, root);

        const languageEntry = root.querySelector<HTMLButtonElement>(
            '[data-toolbar-menu-entry="language"]'
        );
        const english = root.querySelector<HTMLButtonElement>('[data-choice-option="en"]');
        const spanish = root.querySelector<HTMLButtonElement>('[data-choice-option="es"]');

        expect(languageEntry?.textContent).toContain("English");
        expect(languageEntry?.querySelector(".lucide-languages")).not.toBeNull();
        expect(english?.textContent).toBe("EnglishEnglish");
        expect(spanish?.textContent).toBe("EspañolSpanish");
        expect(english?.querySelector(".lucide-languages")).toBeNull();
        expect(spanish?.querySelector(".lucide-languages")).toBeNull();
        expect(english?.getAttribute("aria-checked")).toBe("true");
        expect(spanish?.getAttribute("aria-checked")).toBe("false");
        expect(root.querySelector(".lucide-check")).toBeNull();

        spanish?.click();

        expect(locale()).toBe("es");
        expect(languageEntry?.textContent).toContain("Español");
        expect(english?.getAttribute("aria-checked")).toBe("false");
        expect(spanish?.getAttribute("aria-checked")).toBe("true");
    });

    it("renders the native popover menu with two choices and three dummy options", () => {
        const root = document.createElement("div");
        document.body.append(root);
        dispose = render(() => <Toolbar />, root);

        const trigger = root.querySelector<HTMLButtonElement>(
            '[aria-label="toolbar.moreOptions"][popovertarget]'
        );
        const menuId = trigger?.getAttribute("popovertarget");
        const menu = menuId ? root.querySelector<HTMLElement>(`#${menuId}`) : null;

        expect(trigger).not.toBeNull();
        expect(trigger?.getAttribute("aria-haspopup")).toBe("menu");
        expect(menu?.getAttribute("popover")).toBe("auto");
        expect(menu?.getAttribute("role")).toBe("menu");
        expect(menu?.querySelectorAll('[role="menuitem"]')).toHaveLength(5);
        expect(menu?.querySelectorAll('[role="menuitemradio"]')).toHaveLength(4);
    });
});
