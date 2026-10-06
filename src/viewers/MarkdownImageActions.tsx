/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import {
    type Accessor,
    createEffect,
    createSignal,
    onCleanup,
    onMount,
    Show,
    type JSX,
} from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { type Crepe } from "@milkdown/crepe";
import { editorViewCtx } from "@milkdown/kit/core";
import { type Ctx } from "@milkdown/kit/ctx";
import { NodeSelection, type Selection } from "@milkdown/kit/prose/state";
import Check from "lucide-solid/icons/check";
import Captions from "lucide-solid/icons/captions";
import LinkIcon from "lucide-solid/icons/link";
import Pencil from "lucide-solid/icons/pencil";
import X from "lucide-solid/icons/x";
import { useAppContext } from "../AppContext";
import { translateAppError } from "../AppError";
import { useI18N } from "../Localization";
import {
    imageNavigationHref,
    imageSourceFromDOM,
    navigableImageFromTarget,
    updateImageSourceFromDOM,
} from "./MarkdownImageNavigation";
import styles from "./MarkdownImageActions.module.css";

interface MarkdownImageActionsProps {
    editorRoot: () => HTMLDivElement;
    crepe: Accessor<Crepe | null>;
}

export default function MarkdownImageActions(props: MarkdownImageActionsProps): JSX.Element {
    let actionsRef!: HTMLDivElement;
    let navigationButtonRef!: HTMLButtonElement;
    let editButtonRef!: HTMLButtonElement;
    let captionButtonRef: HTMLButtonElement | undefined;
    let linkEditorRef: HTMLFormElement | undefined;
    let linkInputRef: HTMLInputElement | undefined;
    let hoveredImage: HTMLImageElement | null = null;
    let selectedImage: HTMLImageElement | null = null;
    let observedImage: HTMLImageElement | null = null;
    const [activeImage, setActiveImage] = createSignal<HTMLImageElement | null>(null);
    const [editingImage, setEditingImage] = createSignal<HTMLImageElement | null>(null);
    const [draftSource, setDraftSource] = createSignal("");
    const [buttonPosition, setButtonPosition] = createSignal({ left: 0, top: 0 });

    const { t } = useI18N();
    const {
        main: { basepath, filename, loadFilename, showAppMessage },
    } = useAppContext();

    const navigateToImage = async (image: HTMLImageElement): Promise<void> => {
        const crepe = props.crepe();
        if (!crepe) return;

        let source: string | null = null;
        crepe.editor.action((ctx) => {
            source = imageSourceFromDOM(ctx.get(editorViewCtx), image);
        });
        if (!source) return;

        try {
            const resolvedFilename = await invoke<string | null>("resolve_link", {
                basepath: basepath(),
                filename: filename(),
                href: imageNavigationHref(source),
                mustExist: true,
            });
            if (resolvedFilename !== null) {
                await loadFilename(resolvedFilename);
            }
        } catch (err: unknown) {
            console.error("Unable to resolve editor image:", err);
            showAppMessage(translateAppError(err, t), "error");
        }
    };

    const focusEditor = (): void => {
        const crepe = props.crepe();
        crepe?.editor.action((ctx) => ctx.get(editorViewCtx).focus());
    };

    const stopEditingLink = (focus = true): void => {
        setEditingImage(null);
        if (focus) {
            requestAnimationFrame(focusEditor);
        }
    };

    const startEditingLink = (image: HTMLImageElement): void => {
        const crepe = props.crepe();
        if (!crepe) return;

        let source: string | null = null;
        crepe.editor.action((ctx) => {
            source = imageSourceFromDOM(ctx.get(editorViewCtx), image);
        });
        if (source === null) return;

        setDraftSource(source);
        setEditingImage(image);
        requestAnimationFrame(() => {
            linkInputRef?.focus();
            linkInputRef?.select();
        });
    };

    const saveEditedLink = (): void => {
        const crepe = props.crepe();
        const image = editingImage();
        if (!crepe || !image) return;

        let updated = false;
        crepe.editor.action((ctx) => {
            updated = updateImageSourceFromDOM(
                ctx.get(editorViewCtx),
                image,
                draftSource()
            );
        });
        if (updated) {
            stopEditingLink();
        }
    };

    const toggleImageCaption = (image: HTMLImageElement): void => {
        const nativeCaptionButton = image
            .closest(".milkdown-image-block")
            ?.querySelector<HTMLElement>(":scope > .image-wrapper > .operation > .operation-item");
        nativeCaptionButton?.dispatchEvent(
            new PointerEvent("pointerdown", { bubbles: true, cancelable: true })
        );
    };

    const positionButtons = (): void => {
        const image = activeImage();
        if (!image || !image.isConnected) {
            setActiveImage(null);
            return;
        }

        const imageRect = image.getBoundingClientRect();
        const nodeViewRect = image
            .closest<HTMLElement>(".milkdown-image-block, .milkdown-image-inline")
            ?.getBoundingClientRect();
        const anchorRect =
            imageRect.width > 0 || imageRect.height > 0 ? imageRect : (nodeViewRect ?? imageRect);
        const actionsRect = actionsRef.getBoundingClientRect();
        setButtonPosition({
            left: anchorRect.left - actionsRect.left + 12,
            top: anchorRect.top - actionsRect.top + 12,
        });
    };

    const resizeObserver = new ResizeObserver(positionButtons);

    const syncActiveImage = (): void => {
        const nextImage = editingImage() ?? hoveredImage ?? selectedImage;
        if (observedImage !== nextImage) {
            if (observedImage) resizeObserver.unobserve(observedImage);
            observedImage = nextImage;
            if (nextImage) resizeObserver.observe(nextImage);
        }
        setActiveImage(nextImage);
        if (nextImage) requestAnimationFrame(positionButtons);
    };

    const selectedImageFromSelection = (
        ctx: Ctx,
        selection: Selection
    ): HTMLImageElement | null => {
        if (!(selection instanceof NodeSelection)) return null;

        const nodeDOM = ctx.get(editorViewCtx).nodeDOM(selection.from);
        if (!(nodeDOM instanceof Element)) return null;

        return navigableImageFromTarget(
            nodeDOM.matches("img") ? nodeDOM : (nodeDOM.querySelector("img") ?? nodeDOM),
            props.editorRoot()
        );
    };

    const handleImagePointerOver = (event: PointerEvent): void => {
        if (!(event.target instanceof Element)) return;
        const image = navigableImageFromTarget(event.target, props.editorRoot());
        if (!image) return;
        hoveredImage = image;
        syncActiveImage();
    };

    const isImageActionTarget = (target: EventTarget | null): boolean =>
        target instanceof Node &&
        (navigationButtonRef.contains(target) ||
            editButtonRef.contains(target) ||
            Boolean(captionButtonRef?.contains(target)) ||
            Boolean(linkEditorRef?.contains(target)));

    const handleImagePointerOut = (event: PointerEvent): void => {
        const image = hoveredImage;
        if (!image) return;

        const relatedTarget = event.relatedTarget;
        if (
            isImageActionTarget(relatedTarget) ||
            (relatedTarget instanceof Node &&
                image
                    .closest(".milkdown-image-block, .milkdown-image-inline")
                    ?.contains(relatedTarget))
        ) {
            return;
        }

        hoveredImage = null;
        syncActiveImage();
    };

    const handleEditorPointerDown = (event: PointerEvent): void => {
        if (
            event.target instanceof Element &&
            event.target.closest(".milkdown-image-block, .milkdown-image-inline")
        ) {
            return;
        }

        setEditingImage(null);
        hoveredImage = null;
        selectedImage = null;
        syncActiveImage();
    };

    const handleActionPointerLeave = (event: PointerEvent): void => {
        if (editingImage()) return;

        const image = activeImage();
        if (
            image &&
            (isImageActionTarget(event.relatedTarget) ||
                (event.relatedTarget instanceof Node &&
                    image
                        .closest(".milkdown-image-block, .milkdown-image-inline")
                        ?.contains(event.relatedTarget)))
        ) {
            return;
        }

        hoveredImage = null;
        syncActiveImage();
    };

    createEffect(() => {
        const crepe = props.crepe();
        hoveredImage = null;
        selectedImage = null;
        syncActiveImage();
        if (!crepe) return;

        crepe.on((listener) => {
            listener.selectionUpdated((ctx, selection) => {
                selectedImage = selectedImageFromSelection(ctx, selection);
                syncActiveImage();
            });
        });
    });

    onMount(() => {
        const editorRoot = props.editorRoot();
        editorRoot.addEventListener("pointerover", handleImagePointerOver, {
            capture: true,
        });
        editorRoot.addEventListener("pointerout", handleImagePointerOut, {
            capture: true,
        });
        editorRoot.addEventListener("pointerdown", handleEditorPointerDown, {
            capture: true,
        });
        resizeObserver.observe(editorRoot);
        window.addEventListener("resize", positionButtons);
    });

    onCleanup(() => {
        const editorRoot = props.editorRoot();
        editorRoot.removeEventListener("pointerover", handleImagePointerOver, {
            capture: true,
        });
        editorRoot.removeEventListener("pointerout", handleImagePointerOut, {
            capture: true,
        });
        editorRoot.removeEventListener("pointerdown", handleEditorPointerDown, {
            capture: true,
        });
        window.removeEventListener("resize", positionButtons);
        resizeObserver.disconnect();
    });

    return (
        <div ref={actionsRef} class={`${styles.actions} milkdown`}>
            <div class={`milkdown-code-block ${styles.crepeButtonHost}`}>
                <div class="tools">
                    <div
                        class={`tools-button-group ${styles.buttonGroup}`}
                        hidden={!activeImage()}
                        onPointerLeave={handleActionPointerLeave}
                        style={{
                            left: `${buttonPosition().left}px`,
                            top: `${buttonPosition().top}px`,
                        }}
                    >
                        <button
                            ref={navigationButtonRef}
                            class={`copy-button ${styles.fltButton}`}
                            type="button"
                            aria-label={t("markdownToolbar.openImage")}
                            title={t("markdownToolbar.openImage")}
                            onPointerDown={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                            }}
                            onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                const image = activeImage();
                                if (image) void navigateToImage(image);
                            }}
                        >
                            <LinkIcon aria-hidden="true" />
                            {t("markdownToolbar.openImage")}
                        </button>
                        <button
                            ref={editButtonRef}
                            class={`preview-toggle-button ${styles.fltButton}`}
                            type="button"
                            aria-label={t("markdownToolbar.editImageLink")}
                            title={t("markdownToolbar.editImageLink")}
                            onPointerDown={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                            }}
                            onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                const image = activeImage();
                                if (image) startEditingLink(image);
                            }}
                        >
                            <Pencil aria-hidden="true" />
                            {t("markdownToolbar.editImageLink")}
                        </button>
                        <Show when={activeImage()?.closest(".milkdown-image-block")}>
                            <button
                                ref={captionButtonRef}
                                class={`preview-toggle-button ${styles.fltButton}`}
                                type="button"
                                aria-label={t("markdownToolbar.toggleImageCaption")}
                                title={t("markdownToolbar.toggleImageCaption")}
                                onPointerDown={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                }}
                                onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    const image = activeImage();
                                    if (image) toggleImageCaption(image);
                                }}
                            >
                                <Captions aria-hidden="true" />
                                {t("markdownToolbar.imageCaption")}
                            </button>
                        </Show>
                        <Show when={editingImage()}>
                            <form
                                ref={linkEditorRef}
                                class={styles.linkEditor}
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    saveEditedLink();
                                }}
                                onPointerDown={(event) => event.stopPropagation()}
                            >
                                <input
                                    ref={linkInputRef}
                                    class={styles.linkInput}
                                    aria-label={t("markdownToolbar.imageLink")}
                                    placeholder={t("markdownToolbar.imageLinkPlaceholder")}
                                    value={draftSource()}
                                    onInput={(event) => setDraftSource(event.currentTarget.value)}
                                    onKeyDown={(event) => {
                                        event.stopPropagation();
                                        if (event.key === "Escape") {
                                            event.preventDefault();
                                            stopEditingLink();
                                        }
                                    }}
                                />
                                <button
                                    class={styles.linkEditorButton}
                                    type="submit"
                                    aria-label={t("markdownToolbar.imageLinkConfirm")}
                                    title={t("markdownToolbar.imageLinkConfirm")}
                                >
                                    <Check aria-hidden="true" />
                                </button>
                                <button
                                    class={styles.linkEditorButton}
                                    type="button"
                                    aria-label={t("markdownToolbar.cancelImageLink")}
                                    title={t("markdownToolbar.cancelImageLink")}
                                    onClick={() => stopEditingLink()}
                                >
                                    <X aria-hidden="true" />
                                </button>
                            </form>
                        </Show>
                    </div>
                </div>
            </div>
        </div>
    );
}
