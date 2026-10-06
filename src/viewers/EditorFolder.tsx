/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import {
    createResource,
    createSignal,
    For,
    JSX,
    Match,
    onCleanup,
    Show,
    Switch,
} from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import Eye from "lucide-solid/icons/eye";
import EyeOff from "lucide-solid/icons/eye-off";
import File from "lucide-solid/icons/file";
import Folder from "lucide-solid/icons/folder";
import { useAppContext } from "../AppContext";
import { useI18N } from "../Localization";
import styles from "./EditorFolder.module.css";
import { translateAppError } from "../AppError";
import { Dynamic } from "solid-js/web";
import type { DirectoryEntry } from "../rusttypes";
import Sidebar from "../commons/Sidebar";

type DirectoryResult =
    | { entries: DirectoryEntry[]; error?: never }
    | { entries?: never; error: string };

export function EditorFolder(): JSX.Element {
    const { t } = useI18N();
    const [showHidden, setShowHidden] = createSignal(false);
    const {
        main: { basepath, filename, loadFilename },
        spinner: { showSpinner, hideSpinner, setSpinnerParams },
        editor: { setReloadFile },
    } = useAppContext();
    const [directoryResult, { refetch }] = createResource(
        () => ({ basepath: basepath(), filename: filename(), showHidden: showHidden() }),
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

    const reloadDirectory = async (): Promise<void> => {
        await refetch();
    };
    setReloadFile(reloadDirectory);

    onCleanup(() => {
        setReloadFile(null);
    });

    //  <ToolbarView>
    //     <button class="stdButton small" type="button" aria-label="Add item">
    //         <ListPlus aria-hidden="true" />
    //     </button>
    //     <button class="stdButton small" type="button" aria-label="Refresh folder">
    //         <RefreshCw aria-hidden="true" />
    //         Refresh
    //     </button>
    // </ToolbarView>

    return (
        <section class={styles.studio}>
            <div class="scrollingView">
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
                                <div class="contentView">
                                    <ul class={styles.entryList}>
                                        <For each={directoryResult()?.entries}>
                                            {(entry) => (
                                                <li>
                                                    <button
                                                        class={styles.entryButton}
                                                        onClick={() =>
                                                            void loadFilename(entry.filename)
                                                        }
                                                    >
                                                        <Dynamic
                                                            class={`${styles.entryIcon} ${
                                                                entry.kind === "directory"
                                                                    ? styles.directoryIcon
                                                                    : styles.fileIcon
                                                            }`}
                                                            aria-hidden="true"
                                                            component={
                                                                entry.kind === "directory"
                                                                    ? Folder
                                                                    : File
                                                            }
                                                        />
                                                        <span class={styles.entryName}>
                                                            {entry.name}
                                                        </span>
                                                    </button>
                                                </li>
                                            )}
                                        </For>
                                    </ul>
                                </div>
                            </Show>
                        </Match>
                    </Switch>
                </Show>
            </div>
            <Sidebar>
                <div class="sidebarPanel">
                    <div class="sidebarButtonGrid sidebarButtonGrid--1">
                        <button
                            class={`stdButton toolbar ${showHidden() ? "selected" : ""}`}
                            type="button"
                            aria-pressed={showHidden()}
                            onClick={() => setShowHidden((visible) => !visible)}
                        >
                            <Dynamic
                                component={showHidden() ? EyeOff : Eye}
                                aria-hidden="true"
                            />
                            {t(showHidden() ? "folder.hideHidden" : "folder.showHidden")}
                        </button>
                    </div>
                </div>
            </Sidebar>
        </section>
    );
}

export default EditorFolder;
