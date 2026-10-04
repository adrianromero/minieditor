/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { invoke } from "@tauri-apps/api/core";
import { createEffect, createSignal, onCleanup, type Accessor } from "solid-js";
import { translateAppError } from "./AppError";
import { useAppContext } from "./AppContext";
import { useI18N } from "./Localization";
import type { ReadFileResult, ReadBinaryFileResult } from "./rusttypes";
import { UserMessageError } from "./UserMessageError";

export type FileEditorAdapter<Content = string> = {
    getContent: () => Promise<Content | null>;
    replaceContent: (content: Content, filename: string, onModified: () => void) => Promise<void>;
    destroy: () => void | Promise<void>;
};

export type FileEditorStorage<Content> = {
    read: (basepath: string, filename: string) => Promise<{ content: Content; isNew: boolean }>;
    write: (
        basepath: string,
        filename: string,
        content: Content,
        createIfEmpty: boolean
    ) => Promise<void>;
};

export type FileEditorState =
    | { status: "loading" }
    | { status: "ready" }
    | { status: "error"; message: string };

export type FileEditorController = {
    state: Accessor<FileEditorState>;
};

export const textFileStorage: FileEditorStorage<string> = {
    read: (basepath, filename) => invoke<ReadFileResult>("read_file", { basepath, filename }),
    write: (basepath, filename, content, createIfEmpty) =>
        invoke("write_file", { basepath, filename, content, createIfEmpty }),
};

export const binaryFileStorage: FileEditorStorage<number[]> = {
    read: (basepath, filename) =>
        invoke<ReadBinaryFileResult>("read_binary_file", { basepath, filename }),
    write: (basepath, filename, content, createIfEmpty) =>
        invoke("write_binary_file", {
            basepath,
            filename,
            content,
            createIfEmpty,
        }),
};

export function createFileEditorController<Content = string>(
    editorName: string,
    adapter: FileEditorAdapter<Content>,
    storage: FileEditorStorage<Content>
): FileEditorController {
    const { t } = useI18N();
    const {
        main: { basepath, filename, setOnunload, showAppMessage, showAppConfirmation },
        spinner: { showSpinner, hideSpinner, setSpinnerParams },
        editor: { fileModified, setSaveFile, setReloadFile, setFileModified },
    } = useAppContext();
    const [state, setState] = createSignal<FileEditorState>({ status: "loading" });
    let activeLoad = 0;
    let replacementQueue = Promise.resolve();

    const queueAdapterCleanup = (): void => {
        const cleanupTask = replacementQueue.then(() => adapter.destroy());
        replacementQueue = cleanupTask.then(
            () => undefined,
            (err: unknown) => {
                console.error(`Error destroying editor in ${editorName}:`, err);
            }
        );
    };

    const beginLoading = (): number => {
        const loadId = ++activeLoad;
        setSaveFile(null);
        setReloadFile(null);
        setOnunload(null);
        setFileModified(false);
        setState({ status: "loading" });
        return loadId;
    };

    const enterReadyState = (loadId: number): void => {
        if (loadId !== activeLoad) return;
        setState({ status: "ready" });
        setSaveFile(saveCurrentFile);
        setReloadFile(reloadCurrentFile);
        setOnunload(componentOnUnload);
    };

    const enterErrorState = (loadId: number, err: unknown): void => {
        if (loadId !== activeLoad) return;
        setSaveFile(null);
        setOnunload(null);
        setFileModified(false);
        setState({
            status: "error",
            message: translateAppError(
                err,
                t,
                t("errors.loadFileFailed", { filename: filename() })
            ),
        });
        // Reload remains available as a recovery action after both initial-load
        // and reload failures.
        setReloadFile(reloadCurrentFile);
        queueAdapterCleanup();
    };

    const writeCurrentFile = async (createIfEmpty: boolean): Promise<void> => {
        const content = await adapter.getContent();
        if (content === null) {
            return;
        }

        const currentBasepath = basepath();
        const currentFilename = filename();

        setSpinnerParams(t("editor.saving", { filename: currentFilename }));
        showSpinner();
        try {
            await storage.write(currentBasepath, currentFilename, content, createIfEmpty);
            setFileModified(false);
        } finally {
            hideSpinner();
        }
    };

    const saveCurrentFile = async (): Promise<void> => {
        try {
            await writeCurrentFile(true);
        } catch (err: unknown) {
            console.error(`Error saving file in ${editorName}:`, err);
            await showAppMessage(
                err instanceof UserMessageError ? err.message : translateAppError(err, t),
                "error"
            );
        }
    };

    const componentOnUnload = async (): Promise<void> => {
        if (!fileModified()) {
            return;
        }

        try {
            await writeCurrentFile(false);
        } catch (err: unknown) {
            console.error(`Error automatically saving file in ${editorName}:`, err);
            throw new UserMessageError(
                err instanceof UserMessageError ? err.message : translateAppError(err, t),
                err
            );
        }
    };

    const replaceContentFromDisk = async (
        currentBasepath: string,
        currentFilename: string,
        loadId: number
    ): Promise<boolean> => {
        setSpinnerParams(t("editor.loading", { filename: currentFilename }));
        showSpinner();
        try {
            const result = await storage.read(currentBasepath, currentFilename);
            if (loadId !== activeLoad) return false;

            let applied = false;
            const replaceTask = replacementQueue.then(async () => {
                if (loadId !== activeLoad) return;

                // A previous asynchronous adapter replacement may have completed
                // after this load began. Reset once more immediately before applying
                // the current content.
                await adapter.destroy();
                await adapter.replaceContent(result.content, currentFilename, () => {
                    if (loadId === activeLoad) setFileModified(true);
                });
                if (loadId !== activeLoad) return;

                setFileModified(result.isNew);
                applied = true;
            });
            replacementQueue = replaceTask.then(
                () => undefined,
                () => undefined
            );
            await replaceTask;
            return applied;
        } finally {
            if (loadId === activeLoad) hideSpinner();
        }
    };

    const reloadCurrentFile = async (): Promise<void> => {
        if (state().status !== "error") {
            const confirmed = await showAppConfirmation(
                fileModified() ? t("dialog.reloadDiscardChanges") : t("dialog.reloadFile"),
                "status",
                "dialog.confirm"
            );
            if (!confirmed) {
                return;
            }
        }

        const loadId = beginLoading();
        try {
            const applied = await replaceContentFromDisk(basepath(), filename(), loadId);
            if (applied) enterReadyState(loadId);
        } catch (err: unknown) {
            if (loadId !== activeLoad) return;
            console.error(`Error reloading file in ${editorName}:`, err);
            enterErrorState(loadId, err);
        }
    };

    createEffect(() => {
        const currentBasepath = basepath();
        const currentFilename = filename();

        const loadId = beginLoading();

        void replaceContentFromDisk(currentBasepath, currentFilename, loadId)
            .then((applied) => {
                if (applied) enterReadyState(loadId);
            })
            .catch((err: unknown) => {
                if (loadId !== activeLoad) return;
                console.error(`Error loading file in ${editorName}:`, err);
                enterErrorState(loadId, err);
            });
    });

    onCleanup(() => {
        activeLoad += 1;
        setSaveFile(null);
        setReloadFile(null);
        setOnunload(null);
        setFileModified(false);
        queueAdapterCleanup();
    });

    return { state };
}
