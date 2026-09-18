/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { onCleanup, onMount, createSignal, Show, JSX, createEffect } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { Crepe } from "@milkdown/crepe";
import { remarkStringifyOptionsCtx } from "@milkdown/kit/core";
import { useI18N } from "./Localization";
import { useAppContext } from "./AppContext";

import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";
import ErrorView from "./ErrorView";
import { translateAppError } from "./AppError";
import { UserMessageError } from "./UserMessageError";
import { Ctx } from "@milkdown/kit/ctx";

import styles from "./EditorMarkdown.module.css";
import type { ReadFileResult } from "./rusttypes";

export function EditorMarkdown(): JSX.Element {
    let editorRef!: HTMLDivElement;
    let crepeInstance: Crepe | null = null;

    const { t } = useI18N();
    const {
        main: { basepath, filename, loadFilename, setOnunload, showAppMessage },
        spinner: { showSpinner, hideSpinner, setSpinnerParams },
        editor: { fileModified, setSaveFile, setReloadFile, setFileModified },
    } = useAppContext();
    const [error, setError] = createSignal<string | null>(null);

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

    const writeCurrentFile = async (createIfEmpty: boolean): Promise<void> => {
        if (!crepeInstance) {
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
                content: crepeInstance.getMarkdown(),
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
            console.error("Error saving file in EditorMarkdown:", err);
            showAppMessage(translateAppError(err, t), "error");
        }
    };

    const componentOnUnload = async (): Promise<void> => {
        if (!fileModified()) {
            return;
        }

        try {
            await writeCurrentFile(false);
        } catch (err: unknown) {
            console.error("Error automatically saving file in EditorMarkdown:", err);
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

            crepeInstance?.destroy();
            crepeInstance = new Crepe({
                root: editorRef,
                defaultValue: result.content,
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

                    setFileModified(true);
                });
            });

            await crepeInstance.create();

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
            console.error("Error reloading file in EditorMarkdown:", err);
            await showAppMessage(translateAppError(err, t), "error");
        }
    };

    createEffect(async () => {
        const currentBasepath = basepath();
        const currentFilename = filename();

        try {
            crepeInstance?.destroy();
            crepeInstance = null;

            setSaveFile(null);
            setReloadFile(null);
            setFileModified(false);

            setError(null);
            await replaceContentFromDisk(currentBasepath, currentFilename);
            setSaveFile(saveCurrentFile);
            setReloadFile(reloadCurrentFile);
            setOnunload(componentOnUnload);
        } catch (err: unknown) {
            crepeInstance?.destroy();
            crepeInstance = null;
            console.error("Error loading file in EditorMarkdown:", err);
            setError(translateAppError(err, t));
        }
    });

    onMount(() => {
        editorRef.addEventListener("click", handleLinkPreviewClick, { capture: true });
    });

    onCleanup(() => {
        editorRef.removeEventListener("click", handleLinkPreviewClick, { capture: true });
        setSaveFile(null);
        setReloadFile(null);
        setFileModified(false);
        crepeInstance?.destroy();
        crepeInstance = null;
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
