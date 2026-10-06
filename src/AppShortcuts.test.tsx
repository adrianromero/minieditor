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
    let setSaveAvailable: (available: boolean) => void;
    let setReloadAvailable: (available: boolean) => void;
    let setFileModified: (modified: boolean) => void;
    let setInteractionsBlocked: (blocked: boolean) => void;

    beforeEach(() => {
        saveFile = vi.fn(() => Promise.resolve());
        reloadFile = vi.fn(() => Promise.resolve());
        const [saveAvailable, setSaveAvailableSignal] = createSignal(false);
        const [reloadAvailable, setReloadAvailableSignal] = createSignal(false);
        const [fileModified, setFileModifiedSignal] = createSignal(false);
        const [interactionsBlocked, setInteractionsBlockedSignal] = createSignal(false);

        setSaveAvailable = setSaveAvailableSignal;
        setReloadAvailable = setReloadAvailableSignal;
        setFileModified = setFileModifiedSignal;
        setInteractionsBlocked = setInteractionsBlockedSignal;

        const root = document.createElement("div");
        document.body.append(root);
        dispose = render(
            () => (
                <AppShortcuts
                    saveFile={() => (saveAvailable() ? saveFile : null)}
                    reloadFile={() => (reloadAvailable() ? reloadFile : null)}
                    fileModified={fileModified}
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
        setInteractionsBlocked(true);
        const blockedEvent = press("r");

        setInteractionsBlocked(false);
        const repeatedEvent = press("r", { repeat: true });

        expect(blockedEvent.defaultPrevented).toBe(true);
        expect(repeatedEvent.defaultPrevented).toBe(true);
        expect(reloadFile).not.toHaveBeenCalled();
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
