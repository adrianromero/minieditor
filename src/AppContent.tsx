/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { createResource, JSX, Match, Show, Switch } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import Editor from "./Editor";
import FolderView from "./FolderView";
import { useAppContext } from "./AppContext";
import ErrorView from "./ErrorView";

type PathKind = "file" | "directory" | "other";

type PathResult = { kind: PathKind; error?: never } | { kind: "error"; error: string };

export function AppContent(): JSX.Element {
    const {
        main: { basepath, filename },
        spinner: { showSpinner, hideSpinner, setSpinnerParams },
    } = useAppContext();

    const [pathResult] = createResource(
        () => ({ basepath: basepath(), filename: filename() }),
        async (path): Promise<PathResult> => {
            setSpinnerParams("");
            showSpinner();
            try {
                const kind = await invoke<PathKind>("path_kind", path);
                return { kind };
            } catch (error: unknown) {
                return { kind: "error", error: String(error) };
            } finally {
                hideSpinner();
            }
        }
    );

    return (
        <Show when={!pathResult.loading}>
            <Switch>
                <Match when={pathResult()?.kind === "file"}>
                    <Editor />
                </Match>
                <Match when={pathResult()?.kind === "directory"}>
                    <FolderView />
                </Match>
                <Match when={pathResult()?.kind === "other"}>
                    <ErrorView style="errorStyleStatus">
                        Unsupported path type: {filename()}
                    </ErrorView>
                </Match>
                <Match when={pathResult()?.kind === "error"}>
                    <ErrorView>{pathResult()?.error ?? "Error desconocido"}</ErrorView>
                </Match>
            </Switch>
        </Show>
    );
}

export default AppContent;
