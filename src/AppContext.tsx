/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import {
    Accessor,
    batch,
    createContext,
    createSignal,
    JSX,
    onCleanup,
    onMount,
    Setter,
    useContext,
} from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { SpinnerPanel } from "./SpinnerPanel";
import Dialog from "./Dialog";
import { TranslationKey, useI18N } from "./Localization";
import { UserMessageError } from "./UserMessageError";
import { MessageInfoKind } from "./messagesinfo";
import AppShortcuts, { type ShortcutDefinition } from "./AppShortcuts";
import { loadSidebarVisible, saveSidebarVisible } from "./SidebarPreferences";
import { loadShowHiddenFiles, saveShowHiddenFiles } from "./HiddenFilesPreferences";
import { applyTheme, loadTheme, saveTheme, type AppTheme } from "./ThemePreferences";
import {
    applyTypography,
    loadTypography,
    saveTypography,
    type AppTypography,
} from "./TypographyPreferences";
import OpenWorkspaceDialog from "./OpenWorkspaceDialog";
import type { InitialConfig } from "./rusttypes";
import { translateAppError } from "./AppError";

export type SaveFileHandler = () => Promise<void>;
export type ReloadFileHandler = () => Promise<void>;
export type SearchFileHandler = () => void;
export type ToggleSidebarHandler = () => void;
export type ToggleThemeHandler = () => void;
export type OnunloadHandler = () => Promise<void>;

export type AppContextValues = {
    main: {
        basepath: Accessor<string>;
        setBasepath: Setter<string>;
        openWorkspace: () => void;
        filename: Accessor<string>;
        setFilename: Setter<string>;
        loadFilename: (filename: string) => Promise<void>;
        onunload: Accessor<OnunloadHandler | null>;
        setOnunload: (handler: OnunloadHandler | null) => void;
        showAppMessage: (msg: string, info?: MessageInfoKind) => Promise<void>;
        showAppConfirmation: (
            msg: string,
            info?: MessageInfoKind,
            confirmKey?: TranslationKey
        ) => Promise<boolean>;
    };
    spinner: {
        showSpinner: () => void;
        hideSpinner: () => void;
        setSpinnerParams: (text: string) => void;
    };
    editor: {
        saveFile: Accessor<SaveFileHandler | null>;
        setSaveFile: (handler: SaveFileHandler | null) => void;
        reloadFile: Accessor<ReloadFileHandler | null>;
        setReloadFile: (handler: ReloadFileHandler | null) => void;
        searchFile: Accessor<SearchFileHandler | null>;
        setSearchFile: (handler: SearchFileHandler | null) => void;
        sidebarVisible: Accessor<boolean>;
        setSidebarVisible: Setter<boolean>;
        showHiddenFiles: Accessor<boolean>;
        setShowHiddenFiles: Setter<boolean>;
        toggleSidebar: Accessor<ToggleSidebarHandler | null>;
        setToggleSidebar: (handler: ToggleSidebarHandler | null) => void;
        theme: Accessor<AppTheme>;
        setTheme: Setter<AppTheme>;
        toggleTheme: ToggleThemeHandler;
        typography: Accessor<AppTypography>;
        setTypography: Setter<AppTypography>;
        fileModified: Accessor<boolean>;
        setFileModified: Setter<boolean>;
    };
};

export const AppContext = createContext<AppContextValues>();

export function useAppContext() {
    const value = useContext(AppContext);
    if (!value) {
        throw new Error("Missing context Provider");
    }
    return value;
}

export function AppProvider(props: {
    initialBasepath: string;
    initialFilename: string;
    children: JSX.Element;
}): JSX.Element {
    const { t } = useI18N();
    const [basepath, setBasepath] = createSignal(props.initialBasepath);
    const [filename, setFilename] = createSignal(props.initialFilename);

    const [saveFile, setSaveFileSignal] = createSignal<SaveFileHandler | null>(null);
    const [reloadFile, setReloadFileSignal] = createSignal<ReloadFileHandler | null>(null);
    const [searchFile, setSearchFileSignal] = createSignal<SearchFileHandler | null>(null);
    const [sidebarVisible, setSidebarVisibleSignal] = createSignal(loadSidebarVisible());
    const [showHiddenFiles, setShowHiddenFilesSignal] = createSignal(loadShowHiddenFiles());
    const [toggleSidebar, setToggleSidebarSignal] = createSignal<ToggleSidebarHandler | null>(null);
    const initialTheme = loadTheme();
    applyTheme(initialTheme);
    const [theme, setThemeSignal] = createSignal<AppTheme>(initialTheme);
    const initialTypography = loadTypography();
    applyTypography(initialTypography);
    const [typography, setTypographySignal] = createSignal<AppTypography>(initialTypography);
    const [onunload, setOnunloadSignal] = createSignal<OnunloadHandler | null>(null);
    const [fileModified, setFileModified] = createSignal(false);
    const [spinnerVisible, setSpinnerVisible] = createSignal(false);
    const [spinnerText, setSpinnerText] = createSignal("");
    const [workspaceDialogOpen, setWorkspaceDialogOpen] = createSignal(false);

    const [appConfirm, setAppConfirm] = createSignal<(() => void) | null>(null);
    const [appClose, setAppClose] = createSignal<(() => void) | null>(null);
    const [appMessage, setAppMessage] = createSignal<string | null>(null);
    const [appCancelKey, setAppCancelKey] = createSignal<TranslationKey>("dialog.cancel");
    const [appConfirmKey, setAppConfirmKey] = createSignal<TranslationKey>("dialog.continue");
    const [appMessageInfo, setAppMessageInfo] = createSignal<MessageInfoKind>("status");

    const showSpinner = () => setSpinnerVisible(true);
    const hideSpinner = () => setSpinnerVisible(false);
    const setSpinnerParams = (text: string) => setSpinnerText(text);
    const setSaveFile = (handler: SaveFileHandler | null) => {
        setSaveFileSignal(() => handler);
    };
    const setReloadFile = (handler: ReloadFileHandler | null) => {
        setReloadFileSignal(() => handler);
    };
    const setSearchFile = (handler: SearchFileHandler | null) => {
        setSearchFileSignal(() => handler);
    };
    const setToggleSidebar = (handler: ToggleSidebarHandler | null) => {
        setToggleSidebarSignal(() => handler);
    };
    const setSidebarVisible: Setter<boolean> = (value) => {
        const previous = sidebarVisible();
        const visible = setSidebarVisibleSignal(value);
        if (visible !== previous) {
            saveSidebarVisible(visible);
        }
        return visible;
    };
    const setShowHiddenFiles: Setter<boolean> = (value) => {
        const previous = showHiddenFiles();
        const visible = setShowHiddenFilesSignal(value);
        if (visible !== previous) {
            saveShowHiddenFiles(visible);
        }
        return visible;
    };
    const setTheme: Setter<AppTheme> = (value) => {
        const previous = theme();
        const nextTheme = setThemeSignal(value);
        if (nextTheme !== previous) {
            applyTheme(nextTheme);
            saveTheme(nextTheme);
        }
        return nextTheme;
    };
    const toggleTheme = (): void => {
        setTheme((current) => (current === "light" ? "dark" : "light"));
    };
    const setTypography: Setter<AppTypography> = value => {
        const previous = typography();
        const nextTypography = setTypographySignal(value);
        if (nextTypography !== previous) {
            applyTypography(nextTypography);
            saveTypography(nextTypography);
        }
        return nextTypography;
    };
    const saveModifiedFile = (): void | Promise<void> => {
        const handler = saveFile();
        if (handler && fileModified()) {
            return handler();
        }
    };
    const shortcuts = [
        {
            id: "open-workspace",
            key: "o",
            shift: true,
            phase: "capture",
            getHandler: () => openWorkspace,
        },
        {
            id: "save",
            key: "s",
            getHandler: () => saveModifiedFile,
        },
        {
            id: "reload",
            key: "r",
            getHandler: reloadFile,
        },
        {
            id: "search",
            key: "f",
            phase: "capture",
            getHandler: searchFile,
        },
    ] satisfies readonly ShortcutDefinition[];

    const showAppMessage: (msg: string, info?: MessageInfoKind) => Promise<void> = (msg, info) => {
        return new Promise((resolve) => {
            setAppMessageInfo(info ?? "status");
            setAppCancelKey("dialog.close");
            setAppClose(() => resolve);
            setAppConfirm(() => null);
            setAppMessage(msg);
        });
    };

    const showAppConfirmation: (
        msg: string,
        info?: MessageInfoKind,
        confirmKey?: TranslationKey
    ) => Promise<boolean> = (msg, info, confirmKey) => {
        let confirmed = false;
        return new Promise((resolve) => {
            const onConfirm = (): void => {
                confirmed = true;
                setAppMessage(null);
            };
            const onClose = () => {
                resolve(confirmed);
            };
            setAppMessageInfo(info ?? "question");
            setAppCancelKey("dialog.cancel");
            setAppConfirmKey(confirmKey ?? "dialog.continue");
            setAppClose(() => onClose);
            setAppConfirm(() => onConfirm);
            setAppMessage(msg);
        });
    };

    const setOnunload = (handler: OnunloadHandler | null) => {
        setOnunloadSignal(() => handler);
    };

    const openWorkspace = (): void => {
        setWorkspaceDialogOpen(true);
    };

    const selectWorkspace = async (nextBasepath: string): Promise<boolean> => {
        try {
            try {
                await onunload()?.();
            } catch (error: unknown) {
                setWorkspaceDialogOpen(false);
                const message =
                    error instanceof UserMessageError ? error.message : t("errors.unknown");
                const result = await showAppConfirmation(
                    t("dialog.navigationSaveFailed", { error: message }),
                    "error"
                );
                if (!result) {
                    setWorkspaceDialogOpen(true);
                    return false;
                }
            }

            const config = await invoke<InitialConfig>("set_current_basepath", {
                basepath: nextBasepath,
            });
            setOnunload(null);
            batch(() => {
                setBasepath(config.basepath);
                setFilename(config.filename);
            });
            setWorkspaceDialogOpen(false);
            return true;
        } catch (error: unknown) {
            console.error("Unable to change the current workspace:", error);
            setWorkspaceDialogOpen(false);
            await showAppMessage(translateAppError(error, t), "error");
            setWorkspaceDialogOpen(true);
            return false;
        }
    };

    const loadFilename = async (nextFilename: string): Promise<void> => {
        try {
            await onunload()?.();
            setOnunload(null);
        } catch (error: unknown) {
            const message = error instanceof UserMessageError ? error.message : t("errors.unknown");

            const result = await showAppConfirmation(
                t("dialog.navigationSaveFailed", { error: message }),
                "error"
            );
            if (!result) {
                return;
            }
            setOnunload(null);
        }
        setFilename(nextFilename);
        try {
            await invoke("set_current_filename", { filename: nextFilename });
        } catch (error: unknown) {
            console.error("Unable to update the current filename:", error);
        }
    };

    let unlistenCloseRequested: (() => void) | undefined;

    onMount(() => {
        let disposed = false;
        void getCurrentWindow()
            .onCloseRequested(async (event) => {
                event.preventDefault();

                try {
                    await onunload()?.();
                    setOnunload(null);
                } catch (error: unknown) {
                    const message =
                        error instanceof UserMessageError ? error.message : t("errors.unknown");
                    const result = await showAppConfirmation(
                        t("dialog.closeSaveFailed", { error: message }),
                        "error"
                    );
                    if (!result) {
                        return;
                    }
                    setOnunload(null);
                }
                await getCurrentWindow().destroy();
            })
            .then((unlisten) => {
                if (disposed) {
                    unlisten();
                } else {
                    unlistenCloseRequested = unlisten;
                }
            })
            .catch((error: unknown) => {
                console.error("Unable to register the application close handler:", error);
            });

        onCleanup(() => {
            disposed = true;
            unlistenCloseRequested?.();
        });
    });

    return (
        <AppContext.Provider
            value={{
                main: {
                    basepath,
                    setBasepath,
                    openWorkspace,
                    filename,
                    setFilename,
                    loadFilename,
                    onunload,
                    setOnunload,
                    showAppMessage,
                    showAppConfirmation,
                },
                spinner: {
                    showSpinner,
                    hideSpinner,
                    setSpinnerParams,
                },
                editor: {
                    saveFile,
                    setSaveFile,
                    reloadFile,
                    setReloadFile,
                    searchFile,
                    setSearchFile,
                    sidebarVisible,
                    setSidebarVisible,
                    showHiddenFiles,
                    setShowHiddenFiles,
                    toggleSidebar,
                    setToggleSidebar,
                    theme,
                    setTheme,
                    toggleTheme,
                    typography,
                    setTypography,
                    fileModified,
                    setFileModified,
                },
            }}
        >
            {props.children}
            <AppShortcuts
                shortcuts={shortcuts}
                interactionsBlocked={() =>
                    spinnerVisible() || appMessage() !== null || workspaceDialogOpen()
                }
            />
            <SpinnerPanel visible={spinnerVisible()} text={spinnerText()} />

            <Dialog
                open={appMessage() !== null}
                info={appMessageInfo() ?? "status"}
                onCancel={() => setAppMessage(null)}
                message={appMessage() ?? ""}
                cancelLabel={t(appCancelKey())}
                confirmLabel={appConfirm() ? t(appConfirmKey()) : undefined}
                onConfirm={() => appConfirm()?.()}
                onClose={() => appClose()?.()}
            />
            <OpenWorkspaceDialog
                open={workspaceDialogOpen()}
                initialPath={basepath()}
                showHidden={showHiddenFiles()}
                onCancel={() => setWorkspaceDialogOpen(false)}
                onConfirm={selectWorkspace}
            />
        </AppContext.Provider>
    );
}
