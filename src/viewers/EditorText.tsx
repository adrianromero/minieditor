/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { basicSetup } from "codemirror";
import { EditorView } from "@codemirror/view";
import { createEffect, createSignal, JSX, onCleanup, Show } from "solid-js";
import ErrorView from "./ErrorView";
import {
    createFileEditorController,
    textFileStorage,
    type FileEditorAdapter,
} from "../FileEditorController";
import { useI18N } from "../Localization";
import styles from "./EditorText.module.css";
import type { LanguageSupport } from "@codemirror/language";
import AppSidebar from "../commons/AppSidebar";
import SidebarTab from "../commons/SidebarTab";
import SidebarTabSection from "../commons/SidebarTabSection";
import SearchPanel from "../commons/SearchPanel";
import {
    CodeMirrorSearchController,
    externalCodeMirrorSearch,
} from "../search/CodeMirrorSearchController";
import type { SearchController } from "../search/SearchController";
import { useAppContext } from "../AppContext";

type EditorTextProps = {
    extensions?: readonly LanguageSupport[];
};

export function EditorText(props: EditorTextProps): JSX.Element {
    let editorRef!: HTMLDivElement;
    let editorView: EditorView | null = null;
    let currentSearchController: CodeMirrorSearchController | null = null;
    let focusSearch: (() => void) | null = null;
    const [searchController, setSearchController] = createSignal<SearchController | null>(null);
    const [selectedTab, setSelectedTab] = createSignal("search");

    const { t } = useI18N();
    const {
        editor: { setSearchFile, setSidebarVisible },
    } = useAppContext();
    const adapter: FileEditorAdapter = {
        getContent: () => Promise.resolve(editorView?.state.doc.toString() ?? null),
        replaceContent: async (content, _currentFilename, onModified) => {
            currentSearchController?.destroy();
            currentSearchController = null;
            setSearchController(null);
            editorView?.destroy();
            editorView = new EditorView({
                doc: content,
                extensions: [
                    basicSetup,
                    externalCodeMirrorSearch(),
                    EditorView.lineWrapping,
                    ...(props.extensions ?? []),
                    EditorView.updateListener.of((update) => {
                        currentSearchController?.handleEditorUpdate();
                        if (update.docChanged) {
                            onModified();
                        }
                    }),
                ],
                parent: editorRef,
            });
            currentSearchController = new CodeMirrorSearchController(editorView);
            setSearchController(currentSearchController);
        },
        destroy: () => {
            currentSearchController?.destroy();
            currentSearchController = null;
            setSearchController(null);
            editorView?.destroy();
            editorView = null;
        },
    };
    const { state } = createFileEditorController("EditorText", adapter, textFileStorage);
    const error = (): string | null => {
        const current = state();
        return current.status === "error" ? current.message : null;
    };
    const editorDisabled = (): boolean => state().status !== "ready";
    const openSearch = (): void => {
        setSidebarVisible(true);
        setSelectedTab("search");
        requestAnimationFrame(() => focusSearch?.());
    };

    createEffect(() => {
        setSearchFile(state().status === "ready" ? openSearch : null);
    });
    onCleanup(() => setSearchFile(null));

    return (
        <section class={styles.studio}>
            <Show when={error()}>
                <ErrorView>{error() ?? t("errors.unknown")}</ErrorView>
            </Show>
            <div class={`scrollingView ${error() ? "errorView" : ""}`}>
                <div ref={editorRef} class={`contentView ${styles.editorText}`} />
            </div>
            <AppSidebar disabled={editorDisabled()}>
                <SidebarTab
                    selectedKey={selectedTab()}
                    onSelectedKeyChange={(key) => key && setSelectedTab(key)}
                >
                    <SidebarTabSection key="search" label={t("search.title")}>
                        <SearchPanel
                            controller={searchController()}
                            registerFocus={(focus) => {
                                focusSearch = focus;
                            }}
                        />
                    </SidebarTabSection>
                </SidebarTab>
            </AppSidebar>
        </section>
    );
}

export default EditorText;
