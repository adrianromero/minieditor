/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import type { CodeBlockConfig } from "@milkdown/kit/component/code-block";

type PreviewRenderer = CodeBlockConfig["renderPreview"];
type PreviewContent = string | HTMLElement;
type MermaidApi = typeof import("mermaid")["default"];

type MermaidPreviewOptions = {
    loading: PreviewContent;
    errorText: string;
};

type MermaidLoader = () => Promise<MermaidApi>;

let mermaidInstance: Promise<MermaidApi> | null = null;
let renderQueue: Promise<void> = Promise.resolve();
let previewId = 0;

async function loadMermaid(): Promise<MermaidApi> {
    if (!mermaidInstance) {
        mermaidInstance = import("mermaid").then(({ default: mermaid }) => {
            mermaid.initialize({
                startOnLoad: false,
                securityLevel: "strict",
                suppressErrorRendering: true,
                theme: "neutral",
            });
            return mermaid;
        });
    }

    return mermaidInstance;
}

function enqueueRender<T>(render: () => Promise<T>): Promise<T> {
    const result = renderQueue.then(render, render);
    renderQueue = result.then(
        () => undefined,
        () => undefined
    );
    return result;
}

function createPlaceholder(id: string, loading: PreviewContent): HTMLDivElement {
    const placeholder = document.createElement("div");
    placeholder.id = id;
    placeholder.className = "mermaid-preview-loading";

    if (typeof loading === "string") {
        placeholder.textContent = loading;
    } else {
        placeholder.append(loading.cloneNode(true));
    }

    return placeholder;
}

function createError(errorText: string, error: unknown): HTMLDivElement {
    const element = document.createElement("div");
    element.className = "mermaid-preview-error";
    element.setAttribute("role", "alert");

    const details = error instanceof Error ? error.message.split("\n", 1)[0]?.trim() : "";
    element.textContent = details ? `${errorText}: ${details}` : errorText;
    return element;
}

function isCurrentPreview(id: string): boolean {
    return document.getElementById(id)?.classList.contains("mermaid-preview-loading") ?? false;
}

export function createMermaidPreviewRenderer(
    fallback: PreviewRenderer,
    options: MermaidPreviewOptions,
    load: MermaidLoader = loadMermaid
): PreviewRenderer {
    return (language, content, applyPreview) => {
        if (language.trim().toLowerCase() !== "mermaid") {
            return fallback(language, content, applyPreview);
        }

        if (content.trim().length === 0) {
            return null;
        }

        const id = ++previewId;
        const placeholderId = `minieditor-mermaid-preview-${id}`;
        const diagramId = `minieditor-mermaid-diagram-${id}`;
        const placeholder = createPlaceholder(placeholderId, options.loading);

        void enqueueRender(async () => {
            try {
                const mermaid = await load();
                const { svg } = await mermaid.render(diagramId, content);
                if (isCurrentPreview(placeholderId)) {
                    applyPreview(svg);
                }
            } catch (error: unknown) {
                if (isCurrentPreview(placeholderId)) {
                    applyPreview(createError(options.errorText, error));
                }
            }
        });

        return placeholder;
    };
}

