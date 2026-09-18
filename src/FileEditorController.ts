/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { invoke } from "@tauri-apps/api/core";
import { createEffect, createSignal, onCleanup, type Accessor } from "solid-js";
import { translateAppError } from "./AppError";
import { useAppContext } from "./AppContext";
import { useI18N } from "./Localization";
import type { ReadFileResult } from "./rusttypes";
import { UserMessageError } from "./UserMessageError";

export type FileEditorAdapter = {
    getContent: () => string | null;
    replaceContent: (
        content: string,
        filename: string,
        onModified: () => void
    ) => Promise<void>;
    destroy: () => void;
};

export type FileEditorController = {
    error: Accessor<string | null>;
};

export function createFileEditorController(
    editorName: string,
    adapter: FileEditorAdapter
): FileEditorController {
    const { t } = useI18N();
    const {
        main: { basepath, filename, setOnunload, showAppMessage },
        spinner: { showSpinner, hideSpinner, setSpinnerParams },
        editor: { fileModified, setSaveFile, setReloadFile, setFileModified },
    } = useAppContext();
    const [error, setError] = createSignal<string | null>(null);

    const writeCurrentFile = async (createIfEmpty: boolean): Promise<void> => {
        const content = adapter.getContent();
        if (content === null) {
            return;
        }

        const currentBasepath = basepath();
        const currentFilename = filename();

        setSpinnerParams(t("editor.saving", { filename: currentFilename }));
        showSpinner();
        try {
            await invoke("write_file", {
                basepath: currentBasepath,
                filename: currentFilename,
                content,
                createIfEmpty,
            });
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
            await showAppMessage(translateAppError(err, t), "error");
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
            throw new UserMessageError(translateAppError(err, t), err);
        }
    };

    const replaceContentFromDisk = async (
        currentBasepath: string,
        currentFilename: string
    ): Promise<void> => {
        setSpinnerParams(t("editor.loading", { filename: currentFilename }));
        showSpinner();
        try {
            const result = await invoke<ReadFileResult>("read_file", {
                basepath: currentBasepath,
                filename: currentFilename,
            });

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
