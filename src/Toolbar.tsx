/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { Show } from "solid-js";
import PanelRight from "lucide-solid/icons/panel-right";
import Moon from "lucide-solid/icons/moon";
import Sun from "lucide-solid/icons/sun";
import Languages from "lucide-solid/icons/languages";
import TypeIcon from "lucide-solid/icons/type";
import Eye from "lucide-solid/icons/eye";
import EyeOff from "lucide-solid/icons/eye-off";
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
        main: { openWorkspace },
        editor: {
            saveFile,
            reloadFile,
            toggleSidebar,
            sidebarVisible,
            showHiddenFiles,
            setShowHiddenFiles,
            theme,
            setTheme,
            typography,
            setTypography,
            fileModified,
        },
    } = useAppContext();
    type HiddenFilesVisibility = "show" | "hide";
    const hiddenFilesVisibility = (): HiddenFilesVisibility =>
        showHiddenFiles() ? "show" : "hide";

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
                <ToolbarMenu
                    label={t("toolbar.moreOptions")}
                    blocks={[
                        {
                            kind: "action",
                            id: "open-workspace",
                            label: t("toolbar.openWorkspace"),
                            shortcut: "CTRL+SHIFT+O",
                            onSelect: openWorkspace,
                        },
                        {
                            kind: "action",
                            id: "reload",
                            label: t("toolbar.reload"),
                            shortcut: "CTRL+R",
                            disabled: () => reloadFile() === null,
                            onSelect: () => {
                                void reloadFile()?.();
                            },
                        },
                        {
                            kind: "action",
                            id: "save",
                            label: t("toolbar.save"),
                            shortcut: "CTRL+S",
                            disabled: () => saveFile() === null || !fileModified(),
                            onSelect: () => {
                                void saveFile()?.();
                            },
                        },
                        {
                            kind: "section",
                            id: "general",
                            label: t("toolbar.generalSection"),
                            items: [
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
                            ],
                        },
                        {
                            kind: "section",
                            id: "files",
                            label: t("toolbar.filesSection"),
                            items: [
                                {
                                    kind: "choice",
                                    id: "hidden-files",
                                    label: t("folder.hiddenFiles"),
                                    value: hiddenFilesVisibility,
                                    options: [
                                        {
                                            value: "show",
                                            label: t("folder.show"),
                                            icon: Eye,
                                        },
                                        {
                                            value: "hide",
                                            label: t("folder.hide"),
                                            icon: EyeOff,
                                        },
                                    ],
                                    onChange: (visibility): void => {
                                        setShowHiddenFiles(visibility === "show");
                                    },
                                } satisfies ToolbarMenuChoiceItem<HiddenFilesVisibility>,
                            ],
                        },
                        {
                            kind: "section",
                            id: "markdown",
                            label: t("toolbar.markdownSection"),
                            items: [
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
                                            description: t(
                                                "toolbar.sansSerifTypographyDescription"
                                            ),
                                        },
                                        {
                                            value: "serif",
                                            label: t("toolbar.serifTypography"),
                                            description: t(
                                                "toolbar.serifTypographyDescription"
                                            ),
                                        },
                                        {
                                            value: "modern",
                                            label: t("toolbar.modernTypography"),
                                            description: t(
                                                "toolbar.modernTypographyDescription"
                                            ),
                                        },
                                        {
                                            value: "reading",
                                            label: t("toolbar.readingTypography"),
                                            description: t(
                                                "toolbar.readingTypographyDescription"
                                            ),
                                        },
                                    ],
                                    onChange: (nextTypography): void => {
                                        setTypography(nextTypography);
                                    },
                                } satisfies ToolbarMenuChoiceItem<AppTypography>,
                            ],
                        },
                    ]}
                />
            </div>
        </header>
    );
}

export default Toolbar;
