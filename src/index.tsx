/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

/* @refresh reload */
import { invoke } from "@tauri-apps/api/core";
import { render } from "solid-js/web";
import App from "./App";
import type { InitialConfig } from "./rusttypes";
import "./theme.css";

document.documentElement.dataset.theme = "light";

function isEditableTarget(target: EventTarget | null): boolean {
    if (!(target instanceof Element)) {
        return false;
    }

    return (
        target.closest('[contenteditable="true"]') !== null ||
        target.closest("input, textarea") !== null
    );
}

if (import.meta.env.PROD) {
    document.addEventListener("contextmenu", (event: MouseEvent) => {
        if (!isEditableTarget(event.target)) {
            event.preventDefault();
        }
    });
}

async function bootstrap(): Promise<void> {
    const config = await invoke<InitialConfig>("initial_config");
    render(
        () => <App initialBasepath={config.basepath} initialFilename={config.filename} />,
        document.getElementById("root") as HTMLElement
    );
}

void bootstrap();
