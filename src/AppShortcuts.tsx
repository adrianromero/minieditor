/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { type Accessor, type JSX, onCleanup, onMount } from "solid-js";

type ShortcutHandler = () => Promise<void>;

type AppShortcutsProps = {
    saveFile: Accessor<ShortcutHandler | null>;
    reloadFile: Accessor<ShortcutHandler | null>;
    fileModified: Accessor<boolean>;
    interactionsBlocked: Accessor<boolean>;
};

function isPrimaryModifier(event: KeyboardEvent): boolean {
    return (event.ctrlKey || event.metaKey) && !(event.ctrlKey && event.metaKey);
}

function hasExactPrimaryModifiers(event: KeyboardEvent): boolean {
    return isPrimaryModifier(event) && !event.altKey && !event.shiftKey;
}

export function AppShortcuts(props: AppShortcutsProps): JSX.Element {
    const runningActions = new Set<"save" | "reload">();

    const run = (action: "save" | "reload", handler: ShortcutHandler): void => {
        if (runningActions.has(action)) {
            return;
        }

        runningActions.add(action);
        void handler().finally(() => runningActions.delete(action));
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
        if (
            event.defaultPrevented ||
            event.isComposing ||
            !hasExactPrimaryModifiers(event)
        ) {
            return;
        }

        const key = event.key.toLowerCase();
        if (key !== "s" && key !== "r") {
            return;
        }

        // These combinations belong to the application. Always suppress the
        // WebView's Save Page and Reload behaviors, even when the current action
        // is unavailable.
        event.preventDefault();

        if (event.repeat || props.interactionsBlocked()) {
            return;
        }

        if (key === "s") {
            const saveFile = props.saveFile();
            if (saveFile && props.fileModified()) {
                run("save", saveFile);
            }
            return;
        }

        const reloadFile = props.reloadFile();
        if (reloadFile) {
            run("reload", reloadFile);
        }
    };

    onMount(() => document.addEventListener("keydown", handleKeyDown));
    onCleanup(() => document.removeEventListener("keydown", handleKeyDown));

    return <></>;
}

export default AppShortcuts;
