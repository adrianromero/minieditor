/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { invoke } from "@tauri-apps/api/core";
import ArrowUp from "lucide-solid/icons/arrow-up";
import Folder from "lucide-solid/icons/folder";
import FolderOpen from "lucide-solid/icons/folder-open";
import HardDrive from "lucide-solid/icons/hard-drive";
import { createEffect, createSignal, For, JSX, Show } from "solid-js";
import { translateAppError } from "./AppError";
import dialogStyles from "./Dialog.module.css";
import styles from "./OpenWorkspaceDialog.module.css";
import folderStyles from "./viewers/EditorFolder.module.css";
import { useI18N } from "./Localization";
import type { DirectoryBrowserEntry, DirectoryBrowserLocation } from "./rusttypes";

type OpenWorkspaceDialogProps = {
    open: boolean;
    initialPath: string;
    showHidden: boolean;
    onCancel: () => void;
    onConfirm: (path: string) => Promise<boolean>;
};

export function OpenWorkspaceDialog(props: OpenWorkspaceDialogProps): JSX.Element {
    const { t } = useI18N();
    let dialogRef!: HTMLDialogElement;
    const [location, setLocation] = createSignal<DirectoryBrowserLocation | null>(null);
    const [roots, setRoots] = createSignal<DirectoryBrowserEntry[] | null>(null);
    const [loading, setLoading] = createSignal(false);
    const [confirming, setConfirming] = createSignal(false);
    const [error, setError] = createSignal<string | null>(null);
    let loadSequence = 0;
    let wasOpen = false;

    const loadDirectory = async (path: string): Promise<void> => {
        const sequence = ++loadSequence;
        setLoading(true);
        setError(null);
        try {
            const nextLocation = await invoke<DirectoryBrowserLocation>("browse_directories", {
                path,
                showHidden: props.showHidden,
            });
            if (sequence !== loadSequence) return;
            setRoots(null);
            setLocation(nextLocation);
        } catch (err: unknown) {
            if (sequence !== loadSequence) return;
            setError(translateAppError(err, t));
        } finally {
            if (sequence === loadSequence) setLoading(false);
        }
    };

    const loadRoots = async (): Promise<void> => {
        const sequence = ++loadSequence;
        setLoading(true);
        setError(null);
        try {
            const nextRoots = await invoke<DirectoryBrowserEntry[]>("filesystem_roots");
            if (sequence !== loadSequence) return;
            setRoots(nextRoots);
        } catch (err: unknown) {
            if (sequence !== loadSequence) return;
            setError(translateAppError(err, t));
        } finally {
            if (sequence === loadSequence) setLoading(false);
        }
    };

    createEffect(() => {
        if (props.open && !wasOpen) {
            void loadDirectory(props.initialPath);
        }
        wasOpen = props.open;
        if (props.open && !dialogRef.open) {
            dialogRef.showModal();
        } else if (!props.open && dialogRef.open) {
            dialogRef.close();
        }
    });

    const confirm = async (): Promise<void> => {
        const path = location()?.path;
        if (!path || loading() || confirming()) return;
        setConfirming(true);
        try {
            await props.onConfirm(path);
        } finally {
            setConfirming(false);
        }
    };

    const displayedEntries = () => roots() ?? location()?.directories ?? [];

    return (
        <dialog
            ref={dialogRef}
            class={`${dialogStyles.dialog} ${styles.workspaceDialog}`}
            aria-labelledby="open-workspace-title"
            tabIndex={-1}
            onCancel={(event) => {
                event.preventDefault();
                if (!confirming()) props.onCancel();
            }}
        >
            <div class={`${dialogStyles.iconRow} ${styles.iconRow}`}>
                <FolderOpen class={dialogStyles.icon} aria-hidden="true" />
            </div>
            <h2 id="open-workspace-title" tabIndex={-1} class={dialogStyles.title}>
                {t("workspace.title")}
            </h2>
            <div class={styles.browser}>
                <div class={styles.locationBar}>
                    <button
                        class="stdButton toolbar"
                        type="button"
                        aria-label={t("workspace.roots")}
                        title={t("workspace.roots")}
                        disabled={loading() || confirming()}
                        onClick={() => void loadRoots()}
                    >
                        <HardDrive aria-hidden="true" />
                    </button>
                    <button
                        class="stdButton toolbar"
                        type="button"
                        aria-label={t("workspace.parent")}
                        title={t("workspace.parent")}
                        disabled={!location()?.parent || loading() || confirming()}
                        onClick={() => {
                            const parent = location()?.parent;
                            if (parent) void loadDirectory(parent);
                        }}
                    >
                        <ArrowUp aria-hidden="true" />
                    </button>
                    <div class={styles.currentPath} title={location()?.path ?? ""}>
                        {roots() ? t("workspace.roots") : (location()?.path ?? props.initialPath)}
                    </div>
                </div>
                <div class={styles.directoryList} aria-busy={loading()}>
                    <Show when={error()}>
                        {(message) => <div class={styles.error}>{message()}</div>}
                    </Show>
                    <Show when={loading()}>
                        <div class={styles.status}>{t("workspace.loading")}</div>
                    </Show>
                    <Show when={!loading() && !error() && displayedEntries().length === 0}>
                        <div class={styles.status}>{t("workspace.noFolders")}</div>
                    </Show>
                    <Show when={!loading() && !error()}>
                        <ul class={folderStyles.entryList}>
                            <For each={displayedEntries()}>
                                {(entry) => (
                                    <li>
                                        <button
                                            class={`${folderStyles.entryButton} ${styles.directoryEntry}`}
                                            type="button"
                                            disabled={confirming()}
                                            onClick={() => void loadDirectory(entry.path)}
                                        >
                                            <Folder
                                                class={`${folderStyles.entryIcon} ${folderStyles.directoryIcon} ${styles.directoryIcon}`}
                                                aria-hidden="true"
                                            />
                                            <span class={folderStyles.entryName}>{entry.name}</span>
                                        </button>
                                    </li>
                                )}
                            </For>
                        </ul>
                    </Show>
                </div>
                <p class={styles.hint}>{t("workspace.selectionHint")}</p>
            </div>
            <div class={dialogStyles.actions}>
                <button
                    class="stdButton"
                    type="button"
                    disabled={!location() || roots() !== null || loading() || confirming()}
                    onClick={() => void confirm()}
                >
                    {confirming() ? t("workspace.opening") : t("workspace.open")}
                </button>
                <button
                    class="stdButton"
                    type="button"
                    disabled={confirming()}
                    onClick={props.onCancel}
                >
                    {t("dialog.cancel")}
                </button>
            </div>
        </dialog>
    );
}

export default OpenWorkspaceDialog;
