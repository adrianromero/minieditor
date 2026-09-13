/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import {
    Accessor,
    createContext,
    createSignal,
    JSX,
    onCleanup,
    onMount,
    Setter,
    useContext,
} from "solid-js";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { SpinnerPanel } from "./SpinnerPanel";
import Dialog from "./Dialog";
import { TranslationKey, useI18N } from "./Localization";
import { UserMessageError } from "./UserMessageError";
import { MessageInfoKind } from "./messagesinfo";

export type SaveFileHandler = () => Promise<void>;
export type OnunloadHandler = () => Promise<void>;

export type AppContextValues = {
    main: {
        basepath: Accessor<string>;
        setBasepath: Setter<string>;
        filename: Accessor<string>;
        setFilename: Setter<string>;
        loadFilename: (filename: string) => Promise<void>;
        onunload: Accessor<OnunloadHandler | null>;
        setOnunload: (handler: OnunloadHandler | null) => void;
        showAppMessage: (msg: string, info?: MessageInfoKind) => Promise<void>;
        showAppConfirmation: (msg: string, info?: MessageInfoKind) => Promise<boolean>;
    };
    spinner: {
        showSpinner: () => void;
        hideSpinner: () => void;
        setSpinnerParams: (text: string) => void;
    };
    editor: {
        saveFile: Accessor<SaveFileHandler | null>;
        setSaveFile: (handler: SaveFileHandler | null) => void;
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
    const [onunload, setOnunloadSignal] = createSignal<OnunloadHandler | null>(null);
    const [fileModified, setFileModified] = createSignal(false);
    const [spinnerVisible, setSpinnerVisible] = createSignal(false);
    const [spinnerText, setSpinnerText] = createSignal("");
    const [closeError, setCloseError] = createSignal<string | null>(null);

    const [appConfirm, setAppConfirm] = createSignal<(() => void) | null>(null);
    const [appClose, setAppClose] = createSignal<(() => void) | null>(null);
    const [appMessage, setAppMessage] = createSignal<string | null>(null);
    const [appCancelKey, setAppCancelKey] = createSignal<TranslationKey>("dialog.cancel");
    const [appMessageInfo, setAppMessageInfo] = createSignal<MessageInfoKind>("status");

    const showSpinner = () => setSpinnerVisible(true);
    const hideSpinner = () => setSpinnerVisible(false);
    const setSpinnerParams = (text: string) => setSpinnerText(text);
    const setSaveFile = (handler: SaveFileHandler | null) => {
        setSaveFileSignal(() => handler);
    };

    const showAppMessage: (msg: string, info?: MessageInfoKind) => Promise<void> = (msg, info) => {
        return new Promise((resolve) => {
            setAppMessageInfo(info ?? "status");
            setAppCancelKey("dialog.close");
            setAppClose(() => resolve);
            setAppConfirm(() => null);
            setAppMessage(msg);
        });
    };

    const showAppConfirmation: (msg: string, info?: MessageInfoKind) => Promise<boolean> = (
        msg,
        info
    ) => {
        let confirmed = false;
        return new Promise((resolve) => {
            const onConfirm = (): void => {
                confirmed = true;
                setAppMessage(null);
            };
            const onClose = () => {
                resolve(confirmed);
            };
            setAppMessageInfo(info ?? "status");
            setAppCancelKey("dialog.cancel");
            setAppClose(() => onClose);
            setAppConfirm(() => onConfirm);
            setAppMessage(msg);
        });
    };

    const setOnunload = (handler: OnunloadHandler | null) => {
        setOnunloadSignal(() => handler);
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

    const forceClose = async (): Promise<void> => {
        setCloseError(null);
        await getCurrentWindow().destroy();
    };

    return (
        <AppContext.Provider
            value={{
                main: {
                    basepath,
                    setBasepath,
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
                    fileModified,
                    setFileModified,
                },
            }}
        >
            {props.children}
            <SpinnerPanel visible={spinnerVisible()} text={spinnerText()} />

            <Dialog
                open={closeError() !== null}
                onCancel={() => setCloseError(null)}
                message={t("dialog.closeSaveFailed", { error: closeError() ?? "" })}
                cancelLabel={t("dialog.cancel")}
                confirmLabel={t("dialog.quitAnyway")}
                onConfirm={forceClose}
            />
            <Dialog
                open={appMessage() !== null}
                info={appMessageInfo() ?? "status"}
                onCancel={() => setAppMessage(null)}
                message={appMessage() ?? ""}
                cancelLabel={t(appCancelKey())}
                confirmLabel={appConfirm() ? t("dialog.continue") : undefined}
                onConfirm={() => appConfirm()?.()}
                onClose={() => appClose()?.()}
            />
        </AppContext.Provider>
    );
}
