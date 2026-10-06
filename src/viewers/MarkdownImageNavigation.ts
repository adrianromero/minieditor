/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import type { Node as ProseMirrorNode } from "@milkdown/kit/prose/model";
import { NodeSelection } from "@milkdown/kit/prose/state";
import type { EditorView } from "@milkdown/kit/prose/view";
import { localImageSource } from "./MarkdownImageProxy";

const imageNodeNames = new Set(["image", "image-block"]);

export function navigableImageFromTarget(
    target: Element,
    editorRoot: Element
): HTMLImageElement | null {
    const nodeView = target.closest<HTMLElement>(
        ".milkdown-image-block, .milkdown-image-inline"
    );
    const image = nodeView?.querySelector<HTMLImageElement>(
        'img[data-type="image-block"], img.image-inline'
    );

    return image && editorRoot.contains(nodeView) ? image : null;
}

export function imageNavigationHref(source: string): string {
    return localImageSource(source)?.href ?? source;
}

type MarkdownImageNode = {
    node: ProseMirrorNode;
    position: number;
};

function imageNodeFromDOM(view: EditorView, target: Element): MarkdownImageNode | null {
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

        return { node, position };
    } catch {
        return null;
    }
}

export function imageSourceFromDOM(view: EditorView, target: Element): string | null {
    const targetNode = imageNodeFromDOM(view, target);
    return targetNode && typeof targetNode.node.attrs.src === "string"
        ? targetNode.node.attrs.src
        : null;
}

export function updateImageSourceFromDOM(
    view: EditorView,
    target: Element,
    source: string
): boolean {
    const targetNode = imageNodeFromDOM(view, target);
    if (!targetNode) {
        return false;
    }

    const transaction = view.state.tr.setNodeAttribute(targetNode.position, "src", source);
    transaction.setSelection(NodeSelection.create(transaction.doc, targetNode.position));
    view.dispatch(transaction.scrollIntoView());
    return true;
}
