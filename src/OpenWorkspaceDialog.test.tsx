/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { invoke } from "@tauri-apps/api/core";
import { render } from "solid-js/web";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OpenWorkspaceDialog from "./OpenWorkspaceDialog";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));
vi.mock("./Localization", () => ({
    useI18N: () => ({ t: (key: string) => key }),
}));

const invokeMock = vi.mocked(invoke);

describe("OpenWorkspaceDialog", () => {
    let dispose: (() => void) | undefined;

    beforeEach(() => {
        if (typeof HTMLDialogElement.prototype.showModal !== "function") {
            Object.defineProperties(HTMLDialogElement.prototype, {
                showModal: {
                    configurable: true,
                    value(this: HTMLDialogElement): void {
                        this.open = true;
                    },
                },
                close: {
                    configurable: true,
                    value(this: HTMLDialogElement): void {
                        this.open = false;
                    },
                },
            });
        }
        invokeMock.mockReset();
        invokeMock.mockImplementation(async (command, args) => {
            if (command === "filesystem_roots") {
                return [{ name: "/", path: "/" }];
            }
            const path = (args as { path: string }).path;
            return {
                path,
                parent: path === "/" ? null : "/",
                directories:
                    path === "/current"
                        ? [{ name: "child", path: "/current/child" }]
                        : [],
            };
        });
    });

    afterEach(() => {
        dispose?.();
        dispose = undefined;
        document.body.replaceChildren();
    });

    it("keeps the closed dialog out of the document layout", () => {
        const root = document.createElement("div");
        document.body.append(root);
        dispose = render(
            () => (
                <OpenWorkspaceDialog
                    open={false}
                    initialPath="/current"
                    showHidden={false}
                    onCancel={vi.fn()}
                    onConfirm={vi.fn(async () => true)}
                />
            ),
            root
        );

        const dialog = root.querySelector("dialog");
        expect(dialog?.open).toBe(false);
        expect(getComputedStyle(dialog as HTMLDialogElement).display).toBe("none");
    });

    it("navigates through folders and confirms the displayed directory", async () => {
        const onConfirm = vi.fn(async () => true);
        const root = document.createElement("div");
        document.body.append(root);
        dispose = render(
            () => (
                <OpenWorkspaceDialog
                    open={true}
                    initialPath="/current"
                    showHidden={false}
                    onCancel={vi.fn()}
                    onConfirm={onConfirm}
                />
            ),
            root
        );

        await vi.waitFor(() => {
            expect(root.querySelector("button")?.ownerDocument.body.textContent).toContain("child");
        });
        root.querySelector<HTMLButtonElement>("button[class*='directoryEntry']")?.click();
        await vi.waitFor(() => {
            expect(root.textContent).toContain("/current/child");
        });

        const openButton = Array.from(root.querySelectorAll<HTMLButtonElement>("button")).find(
            button => button.textContent === "workspace.open"
        );
        openButton?.click();

        await vi.waitFor(() => {
            expect(onConfirm).toHaveBeenCalledWith("/current/child");
        });
        expect(root.querySelector("dialog")?.open).toBe(true);
    });

    it("shows filesystem roots and keeps confirmation disabled there", async () => {
        const root = document.createElement("div");
        document.body.append(root);
        dispose = render(
            () => (
                <OpenWorkspaceDialog
                    open={true}
                    initialPath="/current"
                    showHidden={true}
                    onCancel={vi.fn()}
                    onConfirm={vi.fn(async () => true)}
                />
            ),
            root
        );

        await vi.waitFor(() => expect(root.textContent).toContain("child"));
        root.querySelector<HTMLButtonElement>('[aria-label="workspace.roots"]')?.click();
        await vi.waitFor(() => {
            expect(invokeMock).toHaveBeenCalledWith("filesystem_roots");
        });

        const openButton = Array.from(root.querySelectorAll<HTMLButtonElement>("button")).find(
            button => button.textContent === "workspace.open"
        );
        expect(openButton?.disabled).toBe(true);
    });
});
