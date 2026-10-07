/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AppContextValues, ReloadFileHandler, SaveFileHandler } from "./AppContext";
import Toolbar from "./Toolbar";

let editorContext: AppContextValues["editor"];

vi.mock("./AppContext", () => ({
    useAppContext: () => ({ editor: editorContext }),
}));

vi.mock("./Localization", () => ({
    useI18N: () => ({ t: (key: string) => key }),
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

    beforeEach(() => {
        const [saveFile, setSaveFileSignal] = createSignal<SaveFileHandler | null>(null);
        const [reloadFile, setReloadFileSignal] = createSignal<ReloadFileHandler | null>(null);
        const [toggleSidebar, setToggleSidebarSignal] =
            createSignal<ReturnType<AppContextValues["editor"]["toggleSidebar"]>>(null);
        const [sidebarVisible, setSidebarVisibleSignal] = createSignal(true);
        const [fileModified, setFileModifiedSignal] = createSignal(false);
        setSaveFile = (handler) => setSaveFileSignal(() => handler);
        setReloadFile = (handler) => setReloadFileSignal(() => handler);
        setToggleSidebar = (handler) => setToggleSidebarSignal(() => handler);
        setSidebarVisible = setSidebarVisibleSignal;
        setFileModified = setFileModifiedSignal;

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
});
