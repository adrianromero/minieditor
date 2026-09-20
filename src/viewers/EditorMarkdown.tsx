/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { onCleanup, onMount, Show, JSX } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { Crepe } from "@milkdown/crepe";
import { remarkStringifyOptionsCtx } from "@milkdown/kit/core";
import { useI18N } from "../Localization";
import { useAppContext } from "../AppContext";

import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";
import ErrorView from "./ErrorView";
import { translateAppError } from "../AppError";
import { Ctx } from "@milkdown/kit/ctx";
import { createFileEditorController, type FileEditorAdapter } from "../FileEditorController";

import styles from "./EditorMarkdown.module.css";

export function EditorMarkdown(): JSX.Element {
    let editorRef!: HTMLDivElement;
    let crepeInstance: Crepe | null = null;

    const { t } = useI18N();
    const {
        main: { basepath, filename, loadFilename, showAppMessage },
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
            const resolvedFilename = await invoke<string>("resolve_link", {
                basepath: basepath(),
                filename: filename(),
                href,
            });
            await loadFilename(resolvedFilename);
        } catch (err: unknown) {
            console.error("Unable to resolve editor link:", err);
            showAppMessage(translateAppError(err, t), "error");
        }
    };

    const adapter: FileEditorAdapter = {
        getContent: () => crepeInstance?.getMarkdown() ?? null,
        replaceContent: async (content, _currentFilename, onModified) => {
            crepeInstance?.destroy();
            crepeInstance = new Crepe({
                root: editorRef,
                defaultValue: content,
            });

            crepeInstance.editor.config((ctx) => {
                ctx.update(remarkStringifyOptionsCtx, (options) => ({
                    ...options,
                    bullet: "-" as const,
                }));
            });

            let firstUpdate = true;
            crepeInstance.on((listener) => {
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

            await crepeInstance.create();
        },
        destroy: () => {
            crepeInstance?.destroy();
            crepeInstance = null;
        },
    };
    const { error } = createFileEditorController("EditorMarkdown", adapter);

    onMount(() => {
        editorRef.addEventListener("click", handleLinkPreviewClick, { capture: true });
    });

    onCleanup(() => {
        editorRef.removeEventListener("click", handleLinkPreviewClick, { capture: true });
    });

    return (
        <>
            <Show when={error()}>
                <ErrorView>{error() ?? t("errors.unknown")}</ErrorView>
            </Show>
            <div class={`scrollingView ${error() ? "errorView" : ""}`}>
                <div ref={editorRef} class={`contentView ${styles.editorMarkdown}`} />
            </div>
        </>
    );
}

export default EditorMarkdown;
