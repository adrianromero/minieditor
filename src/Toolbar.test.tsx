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
    let setFileModified: (modified: boolean) => void;

    beforeEach(() => {
        const [saveFile, setSaveFileSignal] = createSignal<SaveFileHandler | null>(null);
        const [reloadFile, setReloadFileSignal] = createSignal<ReloadFileHandler | null>(null);
        const [fileModified, setFileModifiedSignal] = createSignal(false);
        setSaveFile = (handler) => setSaveFileSignal(() => handler);
        setReloadFile = (handler) => setReloadFileSignal(() => handler);
        setFileModified = setFileModifiedSignal;

        editorContext = {
            saveFile,
            setSaveFile,
            reloadFile,
            setReloadFile,
            fileModified,
            setFileModified: setFileModifiedSignal,
        };
    });

    afterEach(() => {
        dispose?.();
        dispose = undefined;
        document.body.replaceChildren();
    });

    it("shows Save disabled when a failed editor only exposes Reload", () => {
        const root = document.createElement("div");
        document.body.append(root);
        dispose = render(() => <Toolbar />, root);

        expect(root.querySelector('[aria-label="toolbar.save"]')).toBeNull();

        setReloadFile(() => Promise.resolve());

        const saveButton = root.querySelector<HTMLButtonElement>('[aria-label="toolbar.save"]');
        expect(saveButton).not.toBeNull();
        expect(saveButton?.disabled).toBe(true);

        const save = vi.fn(() => Promise.resolve());
        setSaveFile(save);
        expect(saveButton?.disabled).toBe(true);

        setFileModified(true);
        expect(saveButton?.disabled).toBe(false);
        expect(root.querySelector('[aria-label="toolbar.unsavedChanges"]')).not.toBeNull();

        saveButton?.click();
        expect(save).toHaveBeenCalledOnce();
    });
});
