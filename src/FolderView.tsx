/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { createResource, For, JSX, Match, Show, Switch } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { faFile, faFolder } from "@fortawesome/free-solid-svg-icons";
import { useAppContext } from "./AppContext";
import { useI18N } from "./Localization";
import styles from "./FolderView.module.css";
import { translateAppError } from "./AppError";
import AppIcon from "./AppIcon";

type DirectoryEntry = {
    name: string;
    filename: string;
    kind: "directory" | "file";
};

type DirectoryResult =
    | { entries: DirectoryEntry[]; error?: never }
    | { entries?: never; error: string };

export function FolderView(): JSX.Element {
    const { t } = useI18N();
    const {
        main: { basepath, filename, loadFilename },
        spinner: { showSpinner, hideSpinner, setSpinnerParams },
    } = useAppContext();
    const [directoryResult] = createResource(
        () => ({ basepath: basepath(), filename: filename() }),
        async (path): Promise<DirectoryResult> => {
            setSpinnerParams(t("folder.loading", { path: path.filename }));
            showSpinner();
            try {
                const entries = await invoke<DirectoryEntry[]>("list_directory", path);
                return { entries };
            } catch (error: unknown) {
                console.error("Unable to list directory:", error);
                return { error: translateAppError(error, t) };
            } finally {
                hideSpinner();
            }
        }
    );

    return (
        <section class="scrollingView">
            <Show when={!directoryResult.loading}>
                <Switch>
                    <Match when={directoryResult()?.error}>
                        <div class={styles.folderError}>{directoryResult()?.error}</div>
                    </Match>
                    <Match when={directoryResult()?.entries}>
                        <Show
                            when={(directoryResult()?.entries?.length ?? 0) > 0}
                            fallback={<div class={styles.emptyFolder}>{t("folder.empty")}</div>}
                        >
                            <ul class={`${styles.entryList} contentView`}>
                                <For each={directoryResult()?.entries}>
                                    {(entry) => (
                                        <li>
                                            <button
                                                class={styles.entryButton}
                                                onClick={() => void loadFilename(entry.filename)}
                                            >
                                                <AppIcon
                                                    class={styles.entryIcon}
                                                    icon={entry.kind === "directory" ? faFolder : faFile}
                                                />
                                                <span class={styles.entryName}>{entry.name}</span>
                                            </button>
                                        </li>
                                    )}
                                </For>
                            </ul>
                        </Show>
                    </Match>
                </Switch>
            </Show>
        </section>
    );
}

export default FolderView;
