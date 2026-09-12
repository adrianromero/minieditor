/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { Accessor, createContext, createSignal, JSX, Setter, Show, useContext } from "solid-js";
import { SpinnerPanel } from "./SpinnerPanel";
import Dialog from "./Dialog";
import { useI18N } from "./Localization";
import { UserMessageError } from "./UserMessageError";

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
    const [dialogError, setDialogError] = createSignal<string | null>(null);

    const showSpinner = () => setSpinnerVisible(true);
    const hideSpinner = () => setSpinnerVisible(false);
    const setSpinnerParams = (text: string) => setSpinnerText(text);
    const setSaveFile = (handler: SaveFileHandler | null) => {
        setSaveFileSignal(() => handler);
    };
    const setOnunload = (handler: OnunloadHandler | null) => {
        setOnunloadSignal(() => handler);
    };
    const loadFilename = async (nextFilename: string): Promise<void> => {
        try {
            await onunload()?.();
            setOnunload(null);
            setFilename(nextFilename);
        } catch (error: unknown) {
            const message = error instanceof UserMessageError ? error.message : t("errors.unknown");
            setDialogError(message);
        }
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
            <Show when={dialogError() !== null}>
                <Dialog
                    open
                    message={dialogError() ?? ""}
                    closeLabel={t("dialog.close")}
                    onClose={() => setDialogError(null)}
                />
            </Show>
        </AppContext.Provider>
    );
}
