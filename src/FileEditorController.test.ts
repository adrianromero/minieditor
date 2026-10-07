/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { createRoot, createSignal } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
    AppContextValues,
    OnunloadHandler,
    ReloadFileHandler,
    SaveFileHandler,
} from "./AppContext";
import {
    createFileEditorController,
    type FileEditorAdapter,
    type FileEditorController,
    type FileEditorStorage,
} from "./FileEditorController";

let appContext: AppContextValues;

vi.mock("./AppContext", () => ({
    useAppContext: () => appContext,
}));

vi.mock("./Localization", () => ({
    hasTranslationKey: (key: string) => key === "backendErrors.read_failed",
    useI18N: () => ({
        t: (key: string) => key,
    }),
}));

describe("createFileEditorController", () => {
    let dispose: (() => void) | undefined;
    let saveFile: SaveFileHandler | null;
    let reloadFile: ReloadFileHandler | null;
    let onunload: OnunloadHandler | null;
    let showAppMessage: AppContextValues["main"]["showAppMessage"];
    let showAppConfirmation: AppContextValues["main"]["showAppConfirmation"];

    beforeEach(() => {
        const [basepath, setBasepath] = createSignal("/documents");
        const [filename, setFilename] = createSignal("notes.md");
        const [fileModified, setFileModified] = createSignal(false);
        const [sidebarVisible, setSidebarVisible] = createSignal(true);
        saveFile = null;
        reloadFile = null;
        onunload = null;
        showAppMessage = vi.fn<AppContextValues["main"]["showAppMessage"]>(() =>
            Promise.resolve()
        );
        showAppConfirmation = vi.fn<AppContextValues["main"]["showAppConfirmation"]>(() =>
            Promise.resolve(true)
        );

        appContext = {
            main: {
                basepath,
                setBasepath,
                filename,
                setFilename,
                loadFilename: vi.fn(() => Promise.resolve()),
                onunload: () => onunload,
                setOnunload: (handler) => {
                    onunload = handler;
                },
                showAppMessage,
                showAppConfirmation,
            },
            spinner: {
                showSpinner: vi.fn(),
                hideSpinner: vi.fn(),
                setSpinnerParams: vi.fn(),
            },
            editor: {
                saveFile: () => saveFile,
                setSaveFile: (handler) => {
                    saveFile = handler;
                },
                reloadFile: () => reloadFile,
                setReloadFile: (handler) => {
                    reloadFile = handler;
                },
                searchFile: () => null,
                setSearchFile: vi.fn(),
                sidebarVisible,
                setSidebarVisible,
                toggleSidebar: () => null,
                setToggleSidebar: vi.fn(),
                fileModified,
                setFileModified,
            },
        };
    });

    afterEach(() => {
        dispose?.();
        dispose = undefined;
    });

    it("uses the same persistent error state when a reload fails", async () => {
        const adapter: FileEditorAdapter = {
            getContent: vi.fn(() => Promise.resolve("content")),
            replaceContent: vi.fn(() => Promise.resolve()),
            destroy: vi.fn(),
        };
        const storage: FileEditorStorage<string> = {
            read: vi
                .fn<FileEditorStorage<string>["read"]>()
                .mockResolvedValueOnce({ content: "loaded", isNew: false })
                .mockRejectedValueOnce({ code: "read_failed" }),
            write: vi.fn(() => Promise.resolve()),
        };
        let controller!: FileEditorController;

        createRoot((rootDispose) => {
            dispose = rootDispose;
            controller = createFileEditorController("TestEditor", adapter, storage);
        });

        await vi.waitFor(() => expect(controller.state().status).toBe("ready"));
        expect(saveFile).not.toBeNull();
        expect(reloadFile).not.toBeNull();

        await reloadFile?.();

        expect(controller.state()).toEqual({
            status: "error",
            message: "backendErrors.read_failed",
        });
        expect(saveFile).toBeNull();
        expect(onunload).toBeNull();
        expect(reloadFile).not.toBeNull();
        expect(showAppMessage).not.toHaveBeenCalled();
    });

    it("allows an initial-load error to recover through reload", async () => {
        let finishFailedEditorCleanup!: () => void;
        const failedEditorCleanup = new Promise<void>((resolve) => {
            finishFailedEditorCleanup = resolve;
        });
        const adapter: FileEditorAdapter = {
            getContent: vi.fn(() => Promise.resolve("content")),
            replaceContent: vi.fn(() => Promise.resolve()),
            destroy: vi
                .fn<FileEditorAdapter["destroy"]>()
                .mockReturnValueOnce(failedEditorCleanup)
                .mockResolvedValue(undefined),
        };
        const storage: FileEditorStorage<string> = {
            read: vi
                .fn<FileEditorStorage<string>["read"]>()
                .mockRejectedValueOnce(new Error("Invalid Markdown"))
                .mockResolvedValueOnce({ content: "recovered", isNew: false }),
            write: vi.fn(() => Promise.resolve()),
        };
        let controller!: FileEditorController;

        createRoot((rootDispose) => {
            dispose = rootDispose;
            controller = createFileEditorController("TestEditor", adapter, storage);
        });

        await vi.waitFor(() =>
            expect(controller.state()).toEqual({
                status: "error",
                message: "errors.loadFileFailed",
            })
        );
        expect(reloadFile).not.toBeNull();

        const retry = reloadFile?.();
        await vi.waitFor(() => expect(storage.read).toHaveBeenCalledTimes(2));
        expect(adapter.replaceContent).not.toHaveBeenCalled();

        finishFailedEditorCleanup();
        await retry;

        expect(controller.state().status).toBe("ready");
        expect(showAppConfirmation).not.toHaveBeenCalled();
        expect(adapter.replaceContent).toHaveBeenCalledWith(
            "recovered",
            "notes.md",
            expect.any(Function)
        );
        expect(saveFile).not.toBeNull();
        expect(onunload).not.toBeNull();
    });
});
