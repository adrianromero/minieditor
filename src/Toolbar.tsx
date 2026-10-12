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
import Languages from "lucide-solid/icons/languages";
import TypeIcon from "lucide-solid/icons/type";
import { useAppContext } from "./AppContext";
import FileBreadcrumb from "./FileBreadcrumb";
import FileNavigation from "./FileNavigation";
import ToolbarMenu, { type ToolbarMenuChoiceItem } from "./ToolbarMenu";
import { useI18N } from "./Localization";
import type { Locale } from "./Localization";
import type { AppTheme } from "./ThemePreferences";
import type { AppTypography } from "./TypographyPreferences";
import styles from "./Toolbar.module.css";

export function Toolbar() {
    const { t, locale, setLocale } = useI18N();
    const {
        editor: {
            saveFile,
            reloadFile,
            toggleSidebar,
            sidebarVisible,
            theme,
            setTheme,
            typography,
            setTypography,
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
                <Show when={reloadFile() || saveFile()}>
                    <span class={styles.actionSeparator} aria-hidden="true" />
                </Show>
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
                <ToolbarMenu
                    label={t("toolbar.moreOptions")}
                    items={[
                        {
                            kind: "choice",
                            id: "theme",
                            label: t("toolbar.theme"),
                            value: theme,
                            options: [
                                {
                                    value: "light",
                                    label: t("toolbar.lightTheme"),
                                    icon: Sun,
                                },
                                {
                                    value: "dark",
                                    label: t("toolbar.darkTheme"),
                                    icon: Moon,
                                },
                            ],
                            onChange: (nextTheme): void => {
                                setTheme(nextTheme);
                            },
                        } satisfies ToolbarMenuChoiceItem<AppTheme>,
                        {
                            kind: "choice",
                            id: "typography",
                            label: t("toolbar.typography"),
                            currentIcon: TypeIcon,
                            value: typography,
                            options: [
                                {
                                    value: "sans-serif",
                                    label: t("toolbar.sansSerifTypography"),
                                    description: t("toolbar.sansSerifTypographyDescription"),
                                },
                                {
                                    value: "serif",
                                    label: t("toolbar.serifTypography"),
                                    description: t("toolbar.serifTypographyDescription"),
                                },
                                {
                                    value: "modern",
                                    label: t("toolbar.modernTypography"),
                                    description: t("toolbar.modernTypographyDescription"),
                                },
                                {
                                    value: "reading",
                                    label: t("toolbar.readingTypography"),
                                    description: t("toolbar.readingTypographyDescription"),
                                },
                            ],
                            onChange: (nextTypography): void => {
                                setTypography(nextTypography);
                            },
                        } satisfies ToolbarMenuChoiceItem<AppTypography>,
                        {
                            kind: "choice",
                            id: "language",
                            label: t("toolbar.language"),
                            currentIcon: Languages,
                            value: locale,
                            options: [
                                {
                                    value: "en",
                                    label: "English",
                                    description: "English",
                                },
                                {
                                    value: "es",
                                    label: "Español",
                                    description: "Spanish",
                                },
                                {
                                    value: "ca",
                                    label: "Català",
                                    description: "Catalan",
                                },
                                {
                                    value: "gl",
                                    label: "Galego",
                                    description: "Galician",
                                },
                                {
                                    value: "eu",
                                    label: "Euskara",
                                    description: "Basque",
                                },
                            ],
                            onChange: (nextLocale): void => {
                                setLocale(nextLocale);
                            },
                        } satisfies ToolbarMenuChoiceItem<Locale>,
                    ]}
                />
            </div>
        </header>
    );
}

export default Toolbar;
