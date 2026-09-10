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
import Dialog from "./Dialog";
import { translateAppError } from "./AppError";

export function Editor(): JSX.Element {
    let editorRef!: HTMLDivElement;
    let crepeInstance: Crepe | null = null;

    const { t } = useI18N();
    const {
        main: { basepath, filename, setFilename },
        spinner: { showSpinner, hideSpinner, setSpinnerParams },
        editor: { setSaveFile, setFileModified },
    } = useAppContext();
    const [error, setError] = createSignal<string | null>(null);
    const [dialogError, setDialogError] = createSignal<string | null>(null);

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
            setFilename(resolvedFilename);
        } catch (err: unknown) {
            console.error("Unable to resolve editor link:", err);
            setDialogError(translateAppError(err, t));
        }
    };

    const saveCurrentFile = async (): Promise<void> => {
        if (!crepeInstance) {
            return;
        }

        const currentBasepath = basepath();
        const currentFilename = filename();

        try {
            setError(null);
            setSpinnerParams(t("editor.saving", { filename: currentFilename }));
            showSpinner();

            await invoke("write_file", {
                basepath: currentBasepath,
                filename: currentFilename,
                content: crepeInstance.getMarkdown(),
            });
            setFileModified(false);
        } catch (err: unknown) {
            console.error("Error saving file in Editor:", err);
            setError(translateAppError(err, t));
        } finally {
            hideSpinner();
        }
    };

    createEffect(async () => {
        const currentBasepath = basepath();
        const currentFilename = filename();

        try {
            if (crepeInstance) {
                crepeInstance.destroy();
                crepeInstance = null;
            }
            setSaveFile(null);
            setFileModified(false);

            setError(null);
            setSpinnerParams(t("editor.loading", { filename: currentFilename }));
            showSpinner();

            // Invoke Tauri command to read the file
            const content = await invoke<string>("read_file", {
                basepath: currentBasepath,
                filename: currentFilename,
            });

            // Initialize the Crepe editor
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

            let ignoreFirstUpdate = true;
            crepeInstance.on((listener) => {
                listener.markdownUpdated(() => {
                    if (ignoreFirstUpdate) {
                        ignoreFirstUpdate = false;
                        return;
                    }
                    setFileModified(true);
                });
            });

            await crepeInstance.create();

            setSaveFile(saveCurrentFile);
        } catch (err: unknown) {
            if (crepeInstance) {
                crepeInstance.destroy();
                crepeInstance = null;
            }
            console.error("Error loading file in Editor:", err);
            setError(translateAppError(err, t));
        } finally {
            hideSpinner();
        }
    });

    onMount(() => {
        editorRef.addEventListener("click", handleLinkPreviewClick, { capture: true });
    });

    onCleanup(() => {
        editorRef.removeEventListener("click", handleLinkPreviewClick, { capture: true });
        setSaveFile(null);
        setFileModified(false);
        if (crepeInstance) {
            crepeInstance.destroy();
        }
    });

    return (
        <>
            <Show when={error()}>
                <ErrorView>{error() ?? t("errors.unknown")}</ErrorView>
            </Show>
            <Dialog
                open={dialogError() !== null}
                title={t("dialog.errorTitle")}
                message={dialogError() ?? ""}
                closeLabel={t("dialog.close")}
                onClose={() => setDialogError(null)}
            />
            <div ref={editorRef} class="scrollingView" />
        </>
    );
}

export default Editor;
