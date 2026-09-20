/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { basicSetup } from "codemirror";
import { EditorView } from "@codemirror/view";
import { JSX, Show } from "solid-js";
import ErrorView from "./ErrorView";
import { createFileEditorController, type FileEditorAdapter } from "./FileEditorController";
import { useI18N } from "./Localization";
import styles from "./EditorText.module.css";
import type { LanguageSupport } from "@codemirror/language";

type EditorTextProps = {
    extensions?: readonly LanguageSupport[];
};

export function EditorText(props: EditorTextProps): JSX.Element {
    let editorRef!: HTMLDivElement;
    let editorView: EditorView | null = null;

    const { t } = useI18N();
    const adapter: FileEditorAdapter = {
        getContent: () => editorView?.state.doc.toString() ?? null,
        replaceContent: async (content, _currentFilename, onModified) => {
            editorView?.destroy();
            editorView = new EditorView({
                doc: content,
                extensions: [
                    basicSetup,
                    EditorView.lineWrapping,
                    ...(props.extensions ?? []),
                    EditorView.updateListener.of((update) => {
                        if (update.docChanged) {
                            onModified();
                        }
                    }),
                ],
                parent: editorRef,
            });
        },
        destroy: () => {
            editorView?.destroy();
            editorView = null;
        },
    };
    const { error } = createFileEditorController("EditorText", adapter);

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
