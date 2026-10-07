/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { type Accessor, type JSX, onCleanup, onMount } from "solid-js";

export type ShortcutHandler = () => void | Promise<void>;
export type ShortcutPhase = "capture" | "bubble";

export type ShortcutDefinition = {
    id: string;
    key: string;
    shift?: boolean;
    alt?: boolean;
    phase?: ShortcutPhase;
    getHandler: Accessor<ShortcutHandler | null>;
};

type AppShortcutsProps = {
    shortcuts: readonly ShortcutDefinition[];
    interactionsBlocked: Accessor<boolean>;
};

function isPrimaryModifier(event: KeyboardEvent): boolean {
    return (event.ctrlKey || event.metaKey) && !(event.ctrlKey && event.metaKey);
}

function matchesShortcut(event: KeyboardEvent, shortcut: ShortcutDefinition): boolean {
    return (
        event.key.toLowerCase() === shortcut.key.toLowerCase() &&
        isPrimaryModifier(event) &&
        event.shiftKey === Boolean(shortcut.shift) &&
        event.altKey === Boolean(shortcut.alt)
    );
}

export function AppShortcuts(props: AppShortcutsProps): JSX.Element {
    const runningActions = new Set<string>();

    const execute = (
        phase: ShortcutPhase,
        shortcut: ShortcutDefinition,
        handler: ShortcutHandler
    ): void => {
        if (phase === "capture") {
            void handler();
            return;
        }

        if (runningActions.has(shortcut.id)) return;
        runningActions.add(shortcut.id);

        try {
            const result = handler();
            if (result) {
                void result.finally(() => runningActions.delete(shortcut.id));
            } else {
                runningActions.delete(shortcut.id);
            }
        } catch (error: unknown) {
            runningActions.delete(shortcut.id);
            throw error;
        }
    };

    const handleKeyDown = (phase: ShortcutPhase, event: KeyboardEvent): void => {
        if (event.defaultPrevented || event.isComposing) return;

        const shortcut = props.shortcuts.find(
            (candidate) =>
                (candidate.phase ?? "bubble") === phase && matchesShortcut(event, candidate)
        );
        if (!shortcut) return;

        event.preventDefault();
        if (phase === "capture") event.stopPropagation();

        const handler = shortcut.getHandler();

        if (!handler || props.interactionsBlocked() || event.repeat) {
            return;
        }

        execute(phase, shortcut, handler);
    };

    const handleCaptureKeyDown = (event: KeyboardEvent): void => handleKeyDown("capture", event);
    const handleBubbleKeyDown = (event: KeyboardEvent): void => handleKeyDown("bubble", event);

    onMount(() => {
        document.addEventListener("keydown", handleCaptureKeyDown, { capture: true });
        document.addEventListener("keydown", handleBubbleKeyDown);
    });
    onCleanup(() => {
        document.removeEventListener("keydown", handleCaptureKeyDown, { capture: true });
        document.removeEventListener("keydown", handleBubbleKeyDown);
    });

    return <></>;
}

export default AppShortcuts;
