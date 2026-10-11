/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { Show } from "solid-js";
import HardDriveDownload from "lucide-solid/icons/hard-drive-download";
import PanelRight from "lucide-solid/icons/panel-right";
import RefreshCw from "lucide-solid/icons/refresh-cw";
import Moon from "lucide-solid/icons/moon";
import Sun from "lucide-solid/icons/sun";
import { useAppContext } from "./AppContext";
import FileBreadcrumb from "./FileBreadcrumb";
import FileNavigation from "./FileNavigation";
import { useI18N } from "./Localization";
import styles from "./Toolbar.module.css";

export function Toolbar() {
    const { t } = useI18N();
    const {
        editor: {
            saveFile,
            reloadFile,
            toggleSidebar,
            sidebarVisible,
            theme,
            toggleTheme,
            fileModified,
        },
    } = useAppContext();
    return (
        <header class={styles.editorToolbar}>
            <div class={styles.toolbarLeft}>
                <FileNavigation />
                <FileBreadcrumb />
                <Show when={fileModified()}>
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
                <Show when={toggleSidebar()}>
                    <button
                        class={`stdButton toolbar ${sidebarVisible() ? "selected" : ""}`}
                        type="button"
                        aria-label={t(
                            sidebarVisible() ? "toolbar.hideSidebar" : "toolbar.showSidebar"
                        )}
                        title={t(sidebarVisible() ? "toolbar.hideSidebar" : "toolbar.showSidebar")}
                        aria-pressed={sidebarVisible()}
                        onClick={() => toggleSidebar()?.()}
                    >
                        <PanelRight aria-hidden="true" />
                    </button>
                </Show>
                <button
                    class="stdButton toolbar"
                    type="button"
                    aria-label={t(
                        theme() === "dark" ? "toolbar.useLightTheme" : "toolbar.useDarkTheme"
                    )}
                    title={t(theme() === "dark" ? "toolbar.useLightTheme" : "toolbar.useDarkTheme")}
                    aria-pressed={theme() === "dark"}
                    onClick={toggleTheme}
                >
                    <Show when={theme() === "dark"} fallback={<Moon aria-hidden="true" />}>
                        <Sun aria-hidden="true" />
                    </Show>
                </button>
                <span class={styles.actionSeparator} aria-hidden="true" />
                <Show when={reloadFile()}>
                    <button
                        class="stdButton toolbar"
                        aria-label={t("toolbar.reload")}
                        title={t("toolbar.reload")}
                        onClick={() => {
                            void reloadFile()?.();
                        }}
                    >
                        <RefreshCw aria-hidden="true" />
                    </button>
                </Show>
                <Show when={saveFile()}>
                    <button
                        class="stdButton toolbar"
                        aria-label={t("toolbar.save")}
                        title={t("toolbar.save")}
                        disabled={!fileModified()}
                        onClick={() => {
                            saveFile()?.();
                        }}
                    >
                        <HardDriveDownload aria-hidden="true" />
                    </button>
                </Show>
            </div>
        </header>
    );
}

export default Toolbar;
