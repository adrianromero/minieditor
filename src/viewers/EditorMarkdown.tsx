/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { createEffect, createSignal, onCleanup, onMount, Show, JSX } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { Crepe } from "@milkdown/crepe";
import { editorViewCtx, EditorStatus } from "@milkdown/kit/core";
import { yaml } from "@codemirror/lang-yaml";
import { basicSetup } from "codemirror";
import { EditorView as CodeMirrorEditorView } from "@codemirror/view";
import { useI18N } from "../Localization";
import { useAppContext } from "../AppContext";
import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";
import ErrorView from "./ErrorView";
import { translateAppError } from "../AppError";
import { Ctx } from "@milkdown/kit/ctx";
import {
    createFileEditorController,
    textFileStorage,
    type FileEditorAdapter,
} from "../FileEditorController";

import styles from "./EditorMarkdown.module.css";
import EditorMarkdownSidebar from "./EditorMarkdownSidebar";
import { createMarkdownImageProxy, type MarkdownImageProxy } from "./MarkdownImageProxy";
import MarkdownImageActions from "./MarkdownImageActions";
import { configureMarkdownSerialization } from "./MarkdownSerialization";
import { configureCodeLanguages } from "./CodeLanguages";
import { joinMarkdownFrontmatter, splitMarkdownFrontmatter } from "./MarkdownFrontmatter";
import { ProseMirrorSearchController } from "../search/ProseMirrorSearchController";
import type { SearchController } from "../search/SearchController";

export function EditorMarkdown(): JSX.Element {
    let editorRef!: HTMLDivElement;
    let frontmatterRef!: HTMLDivElement;
    let crepeInstance: Crepe | null = null;
    let frontmatterEditor: CodeMirrorEditorView | null = null;
    let imageProxy: MarkdownImageProxy | null = null;
    let currentSearchController: ProseMirrorSearchController | null = null;
    let focusSearch: (() => void) | null = null;
    const [editorReady, setEditorReady] = createSignal(false);
    const [imageActionsCrepe, setImageActionsCrepe] = createSignal<Crepe | null>(null);
    const [frontmatterVisible, setFrontmatterVisible] = createSignal(false);
    const [searchController, setSearchController] = createSignal<SearchController | null>(null);
    const [selectedSidebarTab, setSelectedSidebarTab] = createSignal("format");

    const { t } = useI18N();
    const {
        main: { basepath, filename, loadFilename, showAppMessage },
        editor: { setSearchFile, setSidebarVisible },
    } = useAppContext();

    const navigateToAnchor = (href: string): boolean => {
        let anchor: string;
        try {
            anchor = decodeURIComponent(href.slice(1));
        } catch (err: unknown) {
            console.error("Unable to decode heading anchor:", err);
            return false;
        }

        if (!anchor) {
            return false;
        }

        const target = document.getElementById(anchor);
        if (!target || !editorRef.contains(target)) {
            return false;
        }

        target.scrollIntoView({ behavior: "smooth", block: "start" });
        return true;
    };

    const handleLinkPreviewClick = async (event: MouseEvent): Promise<void> => {
        const target = event.target;
        if (!(target instanceof Element)) {
            return;
        }

        const link = target.closest<HTMLAnchorElement>(
            ".milkdown-link-preview a.link-display[href]"
        );
        if (!link || !editorRef.contains(link)) {
            return;
        }

        const href = link.getAttribute("href");
        if (!href) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        const preview = link.closest<HTMLElement>(".milkdown-link-preview");
        if (preview) {
            preview.dataset.show = "false";
        }

        if (href.startsWith("#")) {
            if (!navigateToAnchor(href)) {
                console.error("Heading anchor not found:", href);
            }
            return;
        }

        try {
            const resolvedFilename = await invoke<string | null>("resolve_link", {
                basepath: basepath(),
                filename: filename(),
                href,
            });
            if (resolvedFilename !== null) {
                await loadFilename(resolvedFilename);
            }
        } catch (err: unknown) {
            console.error("Unable to resolve editor link:", err);
            showAppMessage(translateAppError(err, t), "error");
        }
    };

    const adapter: FileEditorAdapter = {
        getContent: () => {
            if (!crepeInstance) {
                return Promise.resolve(null);
            }

            const frontmatter = frontmatterEditor?.state.doc.toString() ?? "";
            return Promise.resolve(
                joinMarkdownFrontmatter(frontmatter, crepeInstance.getMarkdown())
            );
        },
        replaceContent: async (content, currentFilename, onModified) => {
            setEditorReady(false);
            setImageActionsCrepe(null);
            currentSearchController?.destroy();
            currentSearchController = null;
            setSearchController(null);
            const document = splitMarkdownFrontmatter(content);
            setFrontmatterVisible(document.hasFrontmatter);
            frontmatterEditor = new CodeMirrorEditorView({
                doc: document.frontmatter,
                extensions: [
                    basicSetup,
                    CodeMirrorEditorView.lineWrapping,
                    yaml(),
                    CodeMirrorEditorView.contentAttributes.of({
                        "aria-label": t("markdownToolbar.frontmatterEditor"),
                    }),
                    CodeMirrorEditorView.updateListener.of((update) => {
                        if (update.docChanged) {
                            onModified();
                        }
                    }),
                ],
                parent: frontmatterRef,
            });
            const nextImageProxy = createMarkdownImageProxy(basepath(), currentFilename);
            const nextCrepe = new Crepe({
                root: editorRef,
                defaultValue: document.markdown,
                featureConfigs: {
                    [Crepe.Feature.CodeMirror]: {
                        // Crepe uses oneDark by default. A neutral view theme lets
                        // basicSetup provide CodeMirror's default light highlighting.
                        theme: CodeMirrorEditorView.theme({}),
                        copyText: t("markdownToolbar.codeCopy"),
                        searchPlaceholder: t("markdownToolbar.codeLanguageSearch"),
                        noResultText: t("markdownToolbar.codeLanguageNoResult"),
                        previewToggleText: (previewOnlyMode) =>
                            t(
                                previewOnlyMode
                                    ? "markdownToolbar.codePreviewEdit"
                                    : "markdownToolbar.codePreviewHide"
                            ),
                        previewLabel: t("markdownToolbar.codePreviewLabel"),
                        previewLoading: t("markdownToolbar.codePreviewLoading"),
                    },
                    [Crepe.Feature.ImageBlock]: {
                        proxyDomURL: nextImageProxy.proxyDomURL,
                        blockUploadPlaceholderText: t("markdownToolbar.imageLinkPlaceholder"),
                        inlineUploadPlaceholderText: t("markdownToolbar.imageLinkPlaceholder"),
                        blockConfirmButton: t("markdownToolbar.imageLinkConfirm"),
                        blockCaptionPlaceholderText: t("markdownToolbar.imageCaptionPlaceholder"),
                    },
                },
                features: {
                    [Crepe.Feature.BlockEdit]: false,
                    [Crepe.Feature.Toolbar]: false,
                },
            });
            imageProxy = nextImageProxy;
            crepeInstance = nextCrepe;
            setImageActionsCrepe(nextCrepe);

            nextCrepe.editor.config(
                configureCodeLanguages(t("markdownToolbar.codePreviewMermaidError"))
            );
            nextCrepe.editor.config(configureMarkdownSerialization);

            let firstUpdate = true;
            nextCrepe.on((listener) => {
                listener.markdownUpdated((_: Ctx, markdown: string, prevMarkdown: string) => {
                    // Mitigates Crepe load changes without user interaction
                    if (firstUpdate) {
                        firstUpdate = false;
                        if (
                            markdown.length === prevMarkdown.length + 1 &&
                            markdown.charAt(markdown.length - 1) === "\u000a" &&
                            markdown.substring(0, markdown.length - 1) === prevMarkdown
                        ) {
                            return;
                        }
                    }

                    onModified();
                });
            });

            await nextCrepe.create();
            nextCrepe.editor.action((ctx) => ctx.get(editorViewCtx).focus());
            nextCrepe.editor.action((ctx) => {
                currentSearchController = new ProseMirrorSearchController(ctx.get(editorViewCtx));
                setSearchController(currentSearchController);
            });
            setEditorReady(true);
        },
        destroy: async () => {
            setEditorReady(false);
            setImageActionsCrepe(null);
            currentSearchController?.destroy();
            currentSearchController = null;
            setSearchController(null);
            setFrontmatterVisible(false);
            frontmatterEditor?.destroy();
            frontmatterEditor = null;
            frontmatterRef.replaceChildren();
            const currentCrepe = crepeInstance;
            crepeInstance = null;
            const currentImageProxy = imageProxy;
            imageProxy = null;
            currentImageProxy?.dispose();

            try {
                // Milkdown leaves a failed create in OnCreate. Calling destroy in
                // that state retries forever, so remove its partial DOM directly.
                if (currentCrepe?.editor.status === EditorStatus.Created) {
                    await currentCrepe.destroy();
                }
            } finally {
                editorRef.replaceChildren();
            }
        },
    };
    const { state } = createFileEditorController("EditorMarkdown", adapter, textFileStorage);
    const error = (): string | null => {
        const current = state();
        return current.status === "error" ? current.message : null;
    };
    const editorDisabled = (): boolean => state().status !== "ready";
    const toggleFrontmatter = (): void => {
        const visible = !frontmatterVisible();
        setFrontmatterVisible(visible);
        requestAnimationFrame(() => {
            if (visible) {
                frontmatterEditor?.requestMeasure();
                frontmatterEditor?.focus();
                return;
            }

            crepeInstance?.editor.action((ctx) => ctx.get(editorViewCtx).focus());
        });
    };
    const openSearch = (): void => {
        setSidebarVisible(true);
        setSelectedSidebarTab("search");
        requestAnimationFrame(() => focusSearch?.());
    };

    createEffect(() => {
        setSearchFile(state().status === "ready" ? openSearch : null);
    });

    onMount(() => {
        editorRef.addEventListener("click", handleLinkPreviewClick, { capture: true });
    });

    onCleanup(() => {
        editorRef.removeEventListener("click", handleLinkPreviewClick, { capture: true });
        setSearchFile(null);
    });

    return (
        <section class={styles.studio}>
            <Show when={error()}>
                <ErrorView>{error() ?? t("errors.unknown")}</ErrorView>
            </Show>
            <div class={`scrollingView ${error() ? "errorView" : ""}`}>
                <div
                    class={`contentView ${styles.frontmatterPanel}`}
                    classList={{ [styles.hidden]: !frontmatterVisible() }}
                    aria-hidden={!frontmatterVisible()}
                >
                    <div class={styles.frontmatterTitle}>
                        {t("markdownToolbar.frontmatterEditor")}
                    </div>
                    <div ref={frontmatterRef} class={styles.frontmatterEditor} />
                </div>
                <div ref={editorRef} class={`contentView milkdowntheme ${styles.editorMarkdown}`} />
                <MarkdownImageActions editorRoot={() => editorRef} crepe={imageActionsCrepe} />
            </div>
            <EditorMarkdownSidebar
                disabled={editorDisabled()}
                getEditor={() => (editorReady() && crepeInstance ? crepeInstance.editor : null)}
                frontmatterVisible={frontmatterVisible()}
                onToggleFrontmatter={toggleFrontmatter}
                searchController={searchController()}
                selectedTab={selectedSidebarTab()}
                onSelectedTabChange={setSelectedSidebarTab}
                registerSearchFocus={(focus) => {
                    focusSearch = focus;
                }}
            />
        </section>
    );
}

export default EditorMarkdown;
