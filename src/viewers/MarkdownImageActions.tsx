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
import Captions from "lucide-solid/icons/captions";
import LinkIcon from "lucide-solid/icons/link";
import { useAppContext } from "../AppContext";
import { translateAppError } from "../AppError";
import { useI18N } from "../Localization";
import {
    imageNavigationHref,
    imageSourceFromDOM,
    navigableImageFromTarget,
} from "./MarkdownImageNavigation";
import styles from "./MarkdownImageActions.module.css";

interface MarkdownImageActionsProps {
    editorRoot: () => HTMLDivElement;
    crepe: Accessor<Crepe | null>;
}

export default function MarkdownImageActions(props: MarkdownImageActionsProps): JSX.Element {
    let actionsRef!: HTMLDivElement;
    let navigationButtonRef!: HTMLButtonElement;
    let captionButtonRef: HTMLButtonElement | undefined;
    let hoveredImage: HTMLImageElement | null = null;
    let selectedImage: HTMLImageElement | null = null;
    let observedImage: HTMLImageElement | null = null;
    const [activeImage, setActiveImage] = createSignal<HTMLImageElement | null>(null);
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
        const actionsRect = actionsRef.getBoundingClientRect();
        // const isBlock = Boolean(image.closest(".milkdown-image-block"));
        setButtonPosition({
            left: imageRect.left - actionsRect.left + 12,
            top: imageRect.top - actionsRect.top + 12,
        });
    };

    const resizeObserver = new ResizeObserver(positionButtons);

    const syncActiveImage = (): void => {
        const nextImage = hoveredImage ?? selectedImage;
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
        (navigationButtonRef.contains(target) || Boolean(captionButtonRef?.contains(target)));

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

        hoveredImage = null;
        selectedImage = null;
        syncActiveImage();
    };

    const handleActionPointerLeave = (event: PointerEvent): void => {
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
                    </div>
                </div>
            </div>
        </div>
    );
}
