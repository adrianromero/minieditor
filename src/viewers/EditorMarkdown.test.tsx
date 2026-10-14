/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { render } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";
import I18NProvider from "../Localization";
import { StoryAppProvider } from "../stories/StoryAppProvider";
import EditorMarkdown from "./EditorMarkdown";

vi.mock("@tauri-apps/api/core", () => ({
    invoke: vi.fn((command: string) => {
        if (command === "read_file") {
            return Promise.resolve({
                content: "![0.33](./plunibio-logo.png)\n\n# Plunibio\n",
                isNew: false,
            });
        }

        if (command === "read_linked_binary_file") {
            return new Promise<number[]>(() => undefined);
        }

        return Promise.resolve(undefined);
    }),
}));

describe("EditorMarkdown", () => {
    let dispose: (() => void) | undefined;
    let root: HTMLDivElement | undefined;

    afterEach(() => {
        dispose?.();
        root?.remove();
        dispose = undefined;
        root = undefined;
    });

    it("loads an image block followed by a heading", async () => {
        root = document.createElement("div");
        document.body.append(root);
        dispose = render(
            () => (
                <I18NProvider>
                    <StoryAppProvider filename="README.md">
                        <EditorMarkdown />
                    </StoryAppProvider>
                </I18NProvider>
            ),
            root
        );

        await vi.waitFor(() => {
            expect(root?.querySelector(".ProseMirror")).not.toBeNull();
            expect(root?.querySelector("h1")?.textContent).toBe("Plunibio");
        });
    });
});
