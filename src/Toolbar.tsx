/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { Show } from "solid-js";
import { Download, HardDriveDownload, HardDriveUpload, RefreshCw } from "lucide-solid";
import { useAppContext } from "./AppContext";
import FileBreadcrumb from "./FileBreadcrumb";
import FileNavigation from "./FileNavigation";
import { useI18N } from "./Localization";
import styles from "./Toolbar.module.css";

export function Toolbar() {
    const { t } = useI18N();
    const {
        editor: { saveFile, reloadFile, fileModified },
    } = useAppContext();
    return (
        <header class={styles.editorToolbar}>
            <div class={styles.toolbarLeft}>
                <FileNavigation />
                <FileBreadcrumb />
                <Show when={saveFile() && fileModified()}>
                    <span
                        class={styles.modifiedIndicator}
                        role="img"
                        aria-label={t("toolbar.unsavedChanges")}
                        title={t("toolbar.unsavedChanges")}
                    >
                        •
                    </span>
                </Show>
            </div>
            <div class={styles.toolbarActions}>
                <Show when={reloadFile()}>
                    <button
                        class="stdButton"
                        aria-label={t("toolbar.reload")}
                        title={t("toolbar.reload")}
                        onClick={() => {
                            void reloadFile()?.();
                        }}
                    >
                        <HardDriveUpload class="actionIcon" aria-hidden="true" />
                    </button>
                </Show>
                <Show when={saveFile()}>
                    <button
                        class="stdButton"
                        aria-label={t("toolbar.save")}
                        title={t("toolbar.save")}
                        disabled={!fileModified()}
                        onClick={() => {
                            saveFile()?.();
                        }}
                    >
                        <HardDriveDownload class="actionIcon" aria-hidden="true" />
                    </button>
                </Show>
            </div>
        </header>
    );
}

export default Toolbar;
