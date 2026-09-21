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
    destroy: () => void;
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

export type FileEditorController = {
    error: Accessor<string | null>;
};

export const textFileStorage: FileEditorStorage<string> = {
    read: (basepath, filename) => invoke<ReadFileResult>("read_file", { basepath, filename }),
    write: (basepath, filename, content, createIfEmpty) =>
        invoke("write_file", { basepath, filename, content, createIfEmpty }),
};

export const binaryFileStorage: FileEditorStorage<number[]> = {
    read: async (basepath, filename) => ({
        content: (
            await invoke<ReadBinaryFileResult>("read_binary_file", {
                basepath,
                filename,
            })
        ).content,
        isNew: false,
    }),
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
    const [error, setError] = createSignal<string | null>(null);

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
        currentFilename: string
    ): Promise<void> => {
        setSpinnerParams(t("editor.loading", { filename: currentFilename }));
        showSpinner();
        try {
            const result = await storage.read(currentBasepath, currentFilename);

            await adapter.replaceContent(result.content, currentFilename, () => {
                setFileModified(true);
            });
            setError(null);
            setFileModified(result.isNew);
        } finally {
            hideSpinner();
        }
    };

    const reloadCurrentFile = async (): Promise<void> => {
        const confirmed = await showAppConfirmation(
            fileModified() ? t("dialog.reloadDiscardChanges") : t("dialog.reloadFile"),
            "status",
            "dialog.confirm"
        );
        if (!confirmed) {
            return;
        }

        try {
            await replaceContentFromDisk(basepath(), filename());
        } catch (err: unknown) {
            console.error(`Error reloading file in ${editorName}:`, err);
            await showAppMessage(translateAppError(err, t), "error");
        }
    };

    createEffect(() => {
        const currentBasepath = basepath();
        const currentFilename = filename();

        adapter.destroy();
        setSaveFile(null);
        setReloadFile(null);
        setFileModified(false);
        setError(null);

        void replaceContentFromDisk(currentBasepath, currentFilename)
            .then(() => {
                setSaveFile(saveCurrentFile);
                setReloadFile(reloadCurrentFile);
                setOnunload(componentOnUnload);
            })
            .catch((err: unknown) => {
                adapter.destroy();
                console.error(`Error loading file in ${editorName}:`, err);
                setError(translateAppError(err, t));
            });
    });

    onCleanup(() => {
        setSaveFile(null);
        setReloadFile(null);
        setOnunload(null);
        setFileModified(false);
        adapter.destroy();
    });

    return { error };
}
