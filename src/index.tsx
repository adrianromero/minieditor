/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

/* @refresh reload */
import { invoke } from "@tauri-apps/api/core";
import { render } from "solid-js/web";
import App from "./App";

type InitialConfig = {
    basepath: string;
    filename: string;
};

async function bootstrap(): Promise<void> {
    const config = await invoke<InitialConfig>("initial_config");
    render(
        () => <App initialBasepath={config.basepath} initialFilename={config.filename} />,
        document.getElementById("root") as HTMLElement
    );
}

void bootstrap();
