/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AppShortcuts from "./AppShortcuts";

describe("AppShortcuts", () => {
    let dispose: (() => void) | undefined;
    let saveFile: ReturnType<typeof vi.fn<() => Promise<void>>>;
    let reloadFile: ReturnType<typeof vi.fn<() => Promise<void>>>;
    let searchFile: ReturnType<typeof vi.fn<() => void>>;
    let customAction: ReturnType<typeof vi.fn<() => void>>;
    let setSaveAvailable: (available: boolean) => void;
    let setReloadAvailable: (available: boolean) => void;
    let setSearchAvailable: (available: boolean) => void;
    let setFileModified: (modified: boolean) => void;
    let setInteractionsBlocked: (blocked: boolean) => void;

    beforeEach(() => {
        saveFile = vi.fn(() => Promise.resolve());
        reloadFile = vi.fn(() => Promise.resolve());
        searchFile = vi.fn();
        customAction = vi.fn();
        const [saveAvailable, setSaveAvailableSignal] = createSignal(false);
        const [reloadAvailable, setReloadAvailableSignal] = createSignal(false);
        const [searchAvailable, setSearchAvailableSignal] = createSignal(false);
        const [fileModified, setFileModifiedSignal] = createSignal(false);
        const [interactionsBlocked, setInteractionsBlockedSignal] = createSignal(false);

        setSaveAvailable = setSaveAvailableSignal;
        setReloadAvailable = setReloadAvailableSignal;
        setSearchAvailable = setSearchAvailableSignal;
        setFileModified = setFileModifiedSignal;
        setInteractionsBlocked = setInteractionsBlockedSignal;

        const saveModifiedFile = (): void | Promise<void> => {
            if (saveAvailable() && fileModified()) {
                return saveFile();
            }
        };

        const root = document.createElement("div");
        document.body.append(root);
        dispose = render(
            () => (
                <AppShortcuts
                    shortcuts={[
                        {
                            id: "save",
                            key: "s",
                            getHandler: () => saveModifiedFile,
                        },
                        {
                            id: "reload",
                            key: "r",
                            getHandler: () => (reloadAvailable() ? reloadFile : null),
                        },
                        {
                            id: "search",
                            key: "f",
                            phase: "capture",
                            getHandler: () => (searchAvailable() ? searchFile : null),
                        },
                        {
                            id: "custom",
                            key: "k",
                            getHandler: () => customAction,
                        },
                    ]}
                    interactionsBlocked={interactionsBlocked}
                />
            ),
            root
        );
    });

    afterEach(() => {
        dispose?.();
        dispose = undefined;
        document.body.replaceChildren();
    });

    function press(key: string, init: KeyboardEventInit = {}): KeyboardEvent {
        const event = new KeyboardEvent("keydown", {
            key,
            ctrlKey: true,
            bubbles: true,
            cancelable: true,
            ...init,
        });
        document.dispatchEvent(event);
        return event;
    }

    it("saves with Mod+S only when Save is available and enabled", () => {
        const unavailableEvent = press("s");
        expect(unavailableEvent.defaultPrevented).toBe(true);
        expect(saveFile).not.toHaveBeenCalled();

        setSaveAvailable(true);
        press("s");
        expect(saveFile).not.toHaveBeenCalled();

        setFileModified(true);
        press("s");
        expect(saveFile).toHaveBeenCalledOnce();
    });

    it("reloads with Mod+R only when Reload is available", () => {
        const unavailableEvent = press("r");
        expect(unavailableEvent.defaultPrevented).toBe(true);
        expect(reloadFile).not.toHaveBeenCalled();

        setReloadAvailable(true);
        press("R", { ctrlKey: false, metaKey: true });
        expect(reloadFile).toHaveBeenCalledOnce();
    });

    it("opens editor search with Mod+F only when Search is available", () => {
        const unavailableEvent = press("f");
        expect(unavailableEvent.defaultPrevented).toBe(true);
        expect(searchFile).not.toHaveBeenCalled();

        setSearchAvailable(true);
        press("F", { ctrlKey: false, metaKey: true });
        expect(searchFile).toHaveBeenCalledOnce();
    });

    it("executes additional shortcuts supplied only through configuration", () => {
        const event = press("k");

        expect(event.defaultPrevented).toBe(true);
        expect(customAction).toHaveBeenCalledOnce();
    });

    it("leaves editor shortcuts and modified variants untouched", () => {
        setSaveAvailable(true);
        setFileModified(true);

        const boldEvent = press("b");
        const saveAsEvent = press("s", { shiftKey: true });

        expect(boldEvent.defaultPrevented).toBe(false);
        expect(saveAsEvent.defaultPrevented).toBe(false);
        expect(saveFile).not.toHaveBeenCalled();
    });

    it("does not execute actions while interaction is blocked or a key repeats", () => {
        setReloadAvailable(true);
        setSearchAvailable(true);
        setInteractionsBlocked(true);
        const blockedEvent = press("r");
        const blockedSearchEvent = press("f");

        setInteractionsBlocked(false);
        const repeatedEvent = press("r", { repeat: true });
        const repeatedSearchEvent = press("f", { repeat: true });

        expect(blockedEvent.defaultPrevented).toBe(true);
        expect(blockedSearchEvent.defaultPrevented).toBe(true);
        expect(repeatedEvent.defaultPrevented).toBe(true);
        expect(repeatedSearchEvent.defaultPrevented).toBe(true);
        expect(reloadFile).not.toHaveBeenCalled();
        expect(searchFile).not.toHaveBeenCalled();
    });

    it("respects an editor that already handled the event", () => {
        setSaveAvailable(true);
        setFileModified(true);
        const event = new KeyboardEvent("keydown", {
            key: "s",
            ctrlKey: true,
            bubbles: true,
            cancelable: true,
        });
        event.preventDefault();

        document.dispatchEvent(event);

        expect(saveFile).not.toHaveBeenCalled();
    });
});
