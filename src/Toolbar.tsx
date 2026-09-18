/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { Show } from "solid-js";
import { useAppContext } from "./AppContext";
import FileBreadcrumb from "./FileBreadcrumb";
import FileNavigation from "./FileNavigation";
import { useI18N } from "./Localization";
import styles from "./Toolbar.module.css";

export function Toolbar() {
    const { t } = useI18N();
    const {
        main: { showAppConfirmation },
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
                        disabled={!fileModified()}
                        onClick={() => {
                            void (async () => {
                                const confirmed = await showAppConfirmation(
                                    t("dialog.reloadDiscardChanges"),
                                    "status",
                                    "dialog.confirm"
                                );
                                if (confirmed) {
                                    await reloadFile()?.();
                                }
                            })();
                        }}
                    >
                        <span>{t("toolbar.reload")}</span>
                    </button>
                </Show>
                <Show when={saveFile()}>
                    <button
                        class="stdButton"
                        disabled={!fileModified()}
                        onClick={() => {
                            saveFile()?.();
                        }}
                    >
                        <span>{t("toolbar.save")}</span>
                    </button>
                </Show>
            </div>
        </header>
    );
}

export default Toolbar;
