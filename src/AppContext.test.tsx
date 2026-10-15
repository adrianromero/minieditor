/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { invoke } from "@tauri-apps/api/core";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppProvider, type AppContextValues, useAppContext } from "./AppContext";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));
vi.mock("@tauri-apps/api/window", () => ({
    getCurrentWindow: () => ({
        onCloseRequested: vi.fn(async () => vi.fn()),
        destroy: vi.fn(async () => undefined),
    }),
}));
vi.mock("./Localization", () => ({
    useI18N: () => ({ t: (key: string) => key }),
}));
vi.mock("./Dialog", () => ({ default: () => null }));
vi.mock("./SpinnerPanel", () => ({ SpinnerPanel: () => null }));
vi.mock("./OpenWorkspaceDialog", () => ({
    default: (props: {
        open: boolean;
        onConfirm: (path: string) => Promise<boolean>;
    }) => (
        <button
            data-testid="confirm-workspace"
            disabled={!props.open}
            onClick={() => void props.onConfirm("/new-workspace")}
        />
    ),
}));

describe("AppProvider workspace changes", () => {
    let dispose: (() => void) | undefined;

    afterEach(() => {
        dispose?.();
        dispose = undefined;
        document.body.replaceChildren();
        vi.mocked(invoke).mockReset();
    });

    it("saves pending editor changes before changing basepath and filename", async () => {
        const calls: string[] = [];
        vi.mocked(invoke).mockImplementation(async command => {
            if (command === "set_current_basepath") {
                calls.push("backend");
                return { basepath: "/new-workspace", filename: "" };
            }
            return undefined;
        });
        let context: AppContextValues | undefined;

        function Probe() {
            context = useAppContext();
            context.main.setOnunload(async () => {
                calls.push("save");
            });
            return null;
        }

        const root = document.createElement("div");
        document.body.append(root);
        dispose = render(
            () => (
                <AppProvider initialBasepath="/old-workspace" initialFilename="note.md">
                    <Probe />
                </AppProvider>
            ),
            root
        );

        context?.main.openWorkspace();
        root.querySelector<HTMLButtonElement>('[data-testid="confirm-workspace"]')?.click();

        await vi.waitFor(() => expect(context?.main.basepath()).toBe("/new-workspace"));
        expect(context?.main.filename()).toBe("");
        expect(calls).toEqual(["save", "backend"]);
    });
});
