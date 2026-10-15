/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { createSignal, type Accessor, type Setter } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DirectoryEntry } from "../rusttypes";
import type { ReloadFileHandler } from "../AppContext";
import EditorFolder from "./EditorFolder";

const invokeMock = vi.hoisted(() => vi.fn());
let reloadFile: ReloadFileHandler | null;
let showHiddenFiles: Accessor<boolean>;
let setShowHiddenFiles: Setter<boolean>;

vi.mock("@tauri-apps/api/core", () => ({ invoke: invokeMock }));

vi.mock("../AppContext", () => ({
    useAppContext: () => ({
        main: {
            basepath: () => "/notes",
            filename: () => "docs",
            loadFilename: vi.fn(),
        },
        spinner: {
            showSpinner: vi.fn(),
            hideSpinner: vi.fn(),
            setSpinnerParams: vi.fn(),
        },
        editor: {
            setReloadFile: (handler: ReloadFileHandler | null) => {
                reloadFile = handler;
            },
            showHiddenFiles,
        },
    }),
}));

vi.mock("../Localization", () => ({
    useI18N: () => ({ t: (key: string) => key }),
}));

describe("EditorFolder", () => {
    let dispose: (() => void) | undefined;

    beforeEach(() => {
        reloadFile = null;
        [showHiddenFiles, setShowHiddenFiles] = createSignal(false);
        invokeMock.mockImplementation(
            async (_command: string, args: { showHidden: boolean }): Promise<DirectoryEntry[]> =>
                args.showHidden
                    ? [
                          { name: ".hidden.md", filename: "docs/.hidden.md", kind: "file" },
                          { name: "visible.md", filename: "docs/visible.md", kind: "file" },
                      ]
                    : [{ name: "visible.md", filename: "docs/visible.md", kind: "file" }]
        );
    });

    afterEach(() => {
        dispose?.();
        dispose = undefined;
        invokeMock.mockReset();
        document.body.replaceChildren();
    });

    it("reloads the directory when the hidden files preference changes", async () => {
        const root = document.createElement("div");
        document.body.append(root);
        dispose = render(() => <EditorFolder />, root);

        await vi.waitFor(() => {
            expect(root.textContent).toContain("visible.md");
        });
        expect(root.textContent).not.toContain(".hidden.md");
        expect(invokeMock).toHaveBeenLastCalledWith("list_directory", {
            basepath: "/notes",
            filename: "docs",
            showHidden: false,
        });

        expect(root.querySelector("aside")).toBeNull();
        setShowHiddenFiles(true);

        await vi.waitFor(() => {
            expect(root.textContent).toContain(".hidden.md");
        });
        expect(invokeMock).toHaveBeenLastCalledWith("list_directory", {
            basepath: "/notes",
            filename: "docs",
            showHidden: true,
        });
    });

    it("registers a context reload handler and removes it on cleanup", async () => {
        let entries: DirectoryEntry[] = [
            { name: "first.md", filename: "docs/first.md", kind: "file" },
        ];
        invokeMock.mockImplementation(async (): Promise<DirectoryEntry[]> => entries);

        const root = document.createElement("div");
        document.body.append(root);
        dispose = render(() => <EditorFolder />, root);

        await vi.waitFor(() => {
            expect(root.textContent).toContain("first.md");
            expect(reloadFile).not.toBeNull();
        });

        entries = [{ name: "external.md", filename: "docs/external.md", kind: "file" }];
        await reloadFile?.();

        await vi.waitFor(() => {
            expect(root.textContent).toContain("external.md");
        });
        expect(root.textContent).not.toContain("first.md");

        dispose();
        dispose = undefined;
        expect(reloadFile).toBeNull();
    });
});
