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
import { useI18N } from "./Localization";
import { translateAppError } from "./AppError";

type PathKind = "file" | "directory" | "other";

type PathResult = { kind: PathKind; error?: never } | { kind: "error"; error: string };

export function RootContent(): JSX.Element {
    const { t } = useI18N();
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
                console.error("Unable to inspect path:", error);
                return { kind: "error", error: translateAppError(error, t) };
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
                    <ErrorView info="status">
                        {t("errors.unsupportedPathType", { filename: filename() })}
                    </ErrorView>
                </Match>
                <Match when={pathResult()?.kind === "error"}>
                    <ErrorView>{pathResult()?.error ?? t("errors.unknown")}</ErrorView>
                </Match>
            </Switch>
        </Show>
    );
}

export default RootContent;
