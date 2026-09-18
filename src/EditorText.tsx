/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { invoke } from "@tauri-apps/api/core";
import { basicSetup } from "codemirror";
import { EditorView } from "@codemirror/view";
import { createEffect, createSignal, JSX, onCleanup, Show } from "solid-js";
import { translateAppError } from "./AppError";
import { useAppContext } from "./AppContext";
import { languageForFilename } from "./EditorLanguage";
import ErrorView from "./ErrorView";
import { useI18N } from "./Localization";
import { UserMessageError } from "./UserMessageError";
import styles from "./EditorText.module.css";
import type { ReadFileResult } from "./rusttypes";

export function EditorText(): JSX.Element {
    let editorRef!: HTMLDivElement;
    let editorView: EditorView | null = null;

    const { t } = useI18N();
    const {
        main: { basepath, filename, setOnunload, showAppMessage },
        spinner: { showSpinner, hideSpinner, setSpinnerParams },
        editor: { fileModified, setSaveFile, setFileModified },
    } = useAppContext();
    const [error, setError] = createSignal<string | null>(null);

    const writeCurrentFile = async (): Promise<void> => {
        if (!editorView) {
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
                content: editorView.state.doc.toString(),
            });
            setFileModified(false);
        } finally {
            hideSpinner();
        }
    };

    const saveCurrentFile = async (): Promise<void> => {
        try {
            await writeCurrentFile();
        } catch (err: unknown) {
            console.error("Error saving file in EditorText:", err);
            showAppMessage(translateAppError(err, t), "error");
        }
    };

    const componentOnUnload = async (): Promise<void> => {
        if (!fileModified()) {
            return;
        }

        try {
            await writeCurrentFile();
        } catch (err: unknown) {
            console.error("Error automatically saving file in EditorText:", err);
            throw new UserMessageError(translateAppError(err, t), err);
        }
    };

    createEffect(async () => {
        const currentBasepath = basepath();
        const currentFilename = filename();

        try {
            editorView?.destroy();
            editorView = null;

            setSaveFile(null);
            setFileModified(false);

            setError(null);
            setSpinnerParams(t("editor.loading", { filename: currentFilename }));
            showSpinner();

            const result = await invoke<ReadFileResult>("read_file", {
                basepath: currentBasepath,
                filename: currentFilename,
            });
            const language = languageForFilename(currentFilename);

            editorView = new EditorView({
                doc: result.content,
                extensions: [
                    basicSetup,
                    EditorView.lineWrapping,
                    ...(language ? [language] : []),
                    EditorView.updateListener.of((update) => {
                        if (update.docChanged) {
                            setFileModified(true);
                        }
                    }),
                ],
                parent: editorRef,
            });

            setFileModified(result.isNew);
            setSaveFile(saveCurrentFile);
            setOnunload(componentOnUnload);
        } catch (err: unknown) {
            editorView?.destroy();
            editorView = null;
            console.error("Error loading file in EditorText:", err);
            setError(translateAppError(err, t));
        } finally {
            hideSpinner();
        }
    });

    onCleanup(() => {
        setSaveFile(null);
        setFileModified(false);
        editorView?.destroy();
        editorView = null;
    });

    return (
        <>
            <Show when={error()}>
                <ErrorView>{error() ?? t("errors.unknown")}</ErrorView>
            </Show>
            <div class={`scrollingView ${error() ? "errorView" : ""}`}>
                <div ref={editorRef} class={`contentView ${styles.editorText}`} />
            </div>
        </>
    );
}

export default EditorText;
