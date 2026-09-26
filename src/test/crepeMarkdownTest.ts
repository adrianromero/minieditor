/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { Crepe } from "@milkdown/crepe";
import { editorViewCtx, remarkStringifyOptionsCtx } from "@milkdown/kit/core";
import type { Ctx } from "@milkdown/kit/ctx";
import type { Node as ProseMirrorNode } from "@milkdown/kit/prose/model";
import { TextSelection } from "@milkdown/kit/prose/state";

const SELECTION_START = "MINIEDITORSELECTIONSTART7F3A";
const SELECTION_END = "MINIEDITORSELECTIONEND7F3A";

type EditorAction = (ctx: Ctx) => void;

function enrichMarkdown(markdown: string): string {
    const startCount = markdown.split("[[").length - 1;
    const endCount = markdown.split("]]").length - 1;

    if (startCount !== 1 || endCount !== 1 || markdown.indexOf("[[") > markdown.indexOf("]]")) {
        throw new Error("El Markdown de test debe contener una única selección [[...]].");
    }

    return markdown.replace("[[", SELECTION_START).replace("]]", SELECTION_END);
}

function findText(doc: ProseMirrorNode, value: string): number {
    let result: number | null = null;

    doc.descendants((node, position) => {
        if (result !== null || !node.isText || !node.text) {
            return;
        }

        const offset = node.text.indexOf(value);
        if (offset >= 0) {
            result = position + offset;
        }
    });

    if (result === null) {
        throw new Error(`No se encontró el marcador interno ${value} en el documento de Crepe.`);
    }

    return result;
}

function installSelection(ctx: Ctx): void {
    const view = ctx.get(editorViewCtx);
    const start = findText(view.state.doc, SELECTION_START);
    const end = findText(view.state.doc, SELECTION_END);
    const transaction = view.state.tr
        .delete(end, end + SELECTION_END.length)
        .delete(start, start + SELECTION_START.length);
    const selectionEnd = end - SELECTION_START.length;

    transaction.setSelection(TextSelection.create(transaction.doc, start, selectionEnd));
    view.dispatch(transaction);
}

function serializeWithSelection(ctx: Ctx, crepe: Crepe): string {
    const view = ctx.get(editorViewCtx);
    const { from, to } = view.state.selection;
    const transaction = view.state.tr
        .insertText(SELECTION_END, to)
        .insertText(SELECTION_START, from);

    view.dispatch(transaction);

    return crepe
        .getMarkdown()
        .replace(SELECTION_START, "[[")
        .replace(SELECTION_END, "]]");
}

/**
 * Carga Markdown enriquecido con [[...]], ejecuta una acción sobre el contexto
 * real de Crepe y devuelve el Markdown serializado con la selección resultante.
 */
export async function runCrepeMarkdownAction(
    markdownWithSelection: string,
    action: EditorAction
): Promise<string> {
    const root = document.createElement("div");
    document.body.append(root);

    const crepe = new Crepe({
        root,
        defaultValue: enrichMarkdown(markdownWithSelection),
    });

    crepe.editor.config((ctx) => {
        ctx.update(remarkStringifyOptionsCtx, (options) => ({ ...options }));
    });

    try {
        await crepe.create();

        let result = "";
        crepe.editor.action((ctx) => {
            installSelection(ctx);
            action(ctx);
            result = serializeWithSelection(ctx, crepe);
        });
        return result;
    } finally {
        await crepe.destroy();
        root.remove();
    }
}
