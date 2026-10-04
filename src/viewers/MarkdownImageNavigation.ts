/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import type { EditorView } from "@milkdown/kit/prose/view";
import { localImageSource } from "./MarkdownImageProxy";

const imageNodeNames = new Set(["image", "image-block"]);

export function navigableImageFromTarget(
    target: Element,
    editorRoot: Element
): HTMLImageElement | null {
    const image = target.closest<HTMLImageElement>(
        '.milkdown-image-block img[data-type="image-block"], ' +
            ".milkdown-image-inline > img.image-inline"
    );

    return image && editorRoot.contains(image) ? image : null;
}

export function imageNavigationHref(source: string): string {
    return localImageSource(source)?.href ?? source;
}

export function imageSourceFromDOM(view: EditorView, target: Element): string | null {
    const nodeView = target.closest<HTMLElement>(
        ".milkdown-image-block, .milkdown-image-inline"
    );
    if (!nodeView || !view.dom.contains(nodeView)) {
        return null;
    }

    try {
        const position = view.posAtDOM(nodeView, 0);
        const node = view.state.doc.nodeAt(position);
        if (!node || !imageNodeNames.has(node.type.name)) {
            return null;
        }

        return typeof node.attrs.src === "string" ? node.attrs.src : null;
    } catch {
        return null;
    }
}
