/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { Accessor, createContext, createSignal, JSX, Setter, useContext } from "solid-js";
import { SpinnerPanel } from "./SpinnerPanel";

export type SaveFileHandler = () => Promise<void>;

export type AppContextValues = {
    main: {
        basepath: Accessor<string>;
        setBasepath: Setter<string>;
        filename: Accessor<string>;
        setFilename: Setter<string>;
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

export function AppProvider(props: { initialBasepath: string; children: JSX.Element }): JSX.Element {
    const [basepath, setBasepath] = createSignal(props.initialBasepath);
    const [filename, setFilename] = createSignal("");

    const [saveFile, setSaveFileSignal] = createSignal<SaveFileHandler | null>(null);
    const [fileModified, setFileModified] = createSignal(false);
    const [spinnerVisible, setSpinnerVisible] = createSignal(false);
    const [spinnerText, setSpinnerText] = createSignal("");

    const showSpinner = () => setSpinnerVisible(true);
    const hideSpinner = () => setSpinnerVisible(false);
    const setSpinnerParams = (text: string) => setSpinnerText(text);
    const setSaveFile = (handler: SaveFileHandler | null) => {
        setSaveFileSignal(() => handler);
    };

    return (
        <AppContext.Provider
            value={{
                main: {
                    basepath,
                    setBasepath,
                    filename,
                    setFilename,
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
        </AppContext.Provider>
    );
}
