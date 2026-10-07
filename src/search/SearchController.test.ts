/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { EditorView } from "@codemirror/view";
import { Crepe } from "@milkdown/crepe";
import { editorViewCtx } from "@milkdown/kit/core";
import {
    CodeMirrorSearchController,
    externalCodeMirrorSearch,
} from "./CodeMirrorSearchController";
import { ProseMirrorSearchController } from "./ProseMirrorSearchController";
import { EMPTY_SEARCH_QUERY, type SearchQueryOptions } from "./SearchController";
import { splitMarkdownFrontmatter } from "../viewers/MarkdownFrontmatter";

const query = (patch: Partial<SearchQueryOptions>): SearchQueryOptions => ({
    ...EMPTY_SEARCH_QUERY,
    ...patch,
});

describe("CodeMirrorSearchController", () => {
    let view: EditorView | null = null;
    let controller: CodeMirrorSearchController | null = null;

    afterEach(() => {
        controller?.destroy();
        view?.destroy();
        controller = null;
        view = null;
        document.body.replaceChildren();
    });

    it("counts, navigates and replaces matches", () => {
        const root = document.createElement("div");
        document.body.append(root);
        view = new EditorView({
            doc: "one two one",
            extensions: [externalCodeMirrorSearch()],
            parent: root,
        });
        controller = new CodeMirrorSearchController(view);

        controller.updateQuery(query({ search: "one", replacement: "three" }));
        expect(controller.getStatus()).toEqual({ total: 2, current: null, valid: true });
        expect(root.querySelectorAll(".cm-searchMatch")).toHaveLength(2);

        expect(controller.findNext()).toBe(true);
        expect(controller.getStatus().current).toBe(1);
        expect(controller.replaceCurrent()).toBe(true);
        expect(view.state.doc.toString()).toBe("three two one");
        expect(controller.getStatus().total).toBe(1);

        expect(controller.replaceAll()).toBe(1);
        expect(view.state.doc.toString()).toBe("three two three");
    });

    it("reports invalid regular expressions", () => {
        const root = document.createElement("div");
        document.body.append(root);
        view = new EditorView({ extensions: [externalCodeMirrorSearch()], parent: root });
        controller = new CodeMirrorSearchController(view);

        controller.updateQuery(query({ search: "[", regexp: true }));
        expect(controller.getStatus()).toEqual({ total: 0, current: null, valid: false });
    });
});

describe("ProseMirrorSearchController", () => {
    let crepe: Crepe | null = null;
    let controller: ProseMirrorSearchController | null = null;

    afterEach(async () => {
        controller?.destroy();
        if (crepe) await crepe.destroy();
        controller = null;
        crepe = null;
        document.body.replaceChildren();
    });

    it("counts, navigates and replaces Milkdown document text", async () => {
        const root = document.createElement("div");
        document.body.append(root);
        crepe = new Crepe({
            root,
            defaultValue: "One **two** one",
            features: { [Crepe.Feature.Toolbar]: false },
        });
        await crepe.create();
        crepe.editor.action((ctx) => {
            controller = new ProseMirrorSearchController(ctx.get(editorViewCtx));
        });

        controller?.updateQuery(query({ search: "one", replacement: "three" }));
        expect(controller?.getStatus()).toEqual({ total: 2, current: null, valid: true });

        const scrollIntoView = vi.spyOn(HTMLElement.prototype, "scrollIntoView");
        expect(controller?.findNext()).toBe(true);
        expect(controller?.getStatus().current).toBe(1);
        expect(root.querySelectorAll(".ProseMirror-active-search-match")).toHaveLength(1);
        expect(scrollIntoView).toHaveBeenCalledWith({ block: "nearest", inline: "nearest" });
        scrollIntoView.mockRestore();
        expect(controller?.replaceCurrent()).toBe(true);
        expect(controller?.replaceAll()).toBe(1);
        expect(crepe.getMarkdown()).toBe("three **two** three\n");
    });

    it("searches the Markdown body without including frontmatter properties", async () => {
        const markdownDocument = splitMarkdownFrontmatter(
            "---\ntitle: hidden match\n---\n\nVisible match\n"
        );
        const root = document.createElement("div");
        document.body.append(root);
        crepe = new Crepe({
            root,
            defaultValue: markdownDocument.markdown,
            features: { [Crepe.Feature.Toolbar]: false },
        });
        await crepe.create();
        crepe.editor.action((ctx) => {
            controller = new ProseMirrorSearchController(ctx.get(editorViewCtx));
        });

        controller?.updateQuery(query({ search: "match" }));
        expect(controller?.getStatus().total).toBe(1);
        controller?.updateQuery(query({ search: "hidden" }));
        expect(controller?.getStatus().total).toBe(0);
    });
});
