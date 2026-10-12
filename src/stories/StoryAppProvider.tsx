import { createEffect, createSignal, type JSX } from "solid-js";
import {
    AppContext,
    type AppContextValues,
    type OnunloadHandler,
    type ReloadFileHandler,
    type SaveFileHandler,
    type SearchFileHandler,
    type ToggleSidebarHandler,
} from "../AppContext";
import { applyTheme } from "../ThemePreferences";
import {
    applyTypography,
    isAppTypography,
    type AppTypography,
} from "../TypographyPreferences";

type StoryAppProviderProps = {
    children: JSX.Element;
    basepath?: string;
    filename?: string;
    modified?: boolean;
    saveAvailable?: boolean;
    reloadAvailable?: boolean;
};

export function StoryAppProvider(props: StoryAppProviderProps): JSX.Element {
    const [basepath, setBasepath] = createSignal(props.basepath ?? "/home/adrian/documents");
    const [filename, setFilename] = createSignal(props.filename ?? "notes/example.md");
    const [onunload, setOnunloadSignal] = createSignal<OnunloadHandler | null>(null);
    const [fileModified, setFileModified] = createSignal(props.modified ?? false);

    const defaultSaveFile: SaveFileHandler = async () => {
        setFileModified(false);
    };
    const defaultReloadFile: ReloadFileHandler = async () => undefined;
    const [saveFile, setSaveFileSignal] = createSignal<SaveFileHandler | null>(
        props.saveAvailable === false ? null : defaultSaveFile
    );
    const [reloadFile, setReloadFileSignal] = createSignal<ReloadFileHandler | null>(
        props.reloadAvailable === false ? null : defaultReloadFile
    );
    const [searchFile, setSearchFileSignal] = createSignal<SearchFileHandler | null>(null);
    const [sidebarVisible, setSidebarVisible] = createSignal(true);
    const [toggleSidebar, setToggleSidebarSignal] = createSignal<ToggleSidebarHandler | null>(null);
    const initialTheme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    const [theme, setTheme] = createSignal<"light" | "dark">(initialTheme);
    const storedTypography = document.documentElement.dataset.typography ?? null;
    const initialTypography: AppTypography = isAppTypography(storedTypography)
        ? storedTypography
        : "sans-serif";
    const [typography, setTypography] = createSignal<AppTypography>(initialTypography);

    createEffect(() => applyTheme(theme()));
    createEffect(() => applyTypography(typography()));

    const setOnunload = (handler: OnunloadHandler | null): void => {
        setOnunloadSignal(() => handler);
    };
    const setSaveFile = (handler: SaveFileHandler | null): void => {
        setSaveFileSignal(() => handler);
    };
    const setReloadFile = (handler: ReloadFileHandler | null): void => {
        setReloadFileSignal(() => handler);
    };
    const setSearchFile = (handler: SearchFileHandler | null): void => {
        setSearchFileSignal(() => handler);
    };
    const setToggleSidebar = (handler: ToggleSidebarHandler | null): void => {
        setToggleSidebarSignal(() => handler);
    };

    const value: AppContextValues = {
        main: {
            basepath,
            setBasepath,
            filename,
            setFilename,
            loadFilename: async (nextFilename) => {
                setFilename(nextFilename);
            },
            onunload,
            setOnunload,
            showAppMessage: async () => undefined,
            showAppConfirmation: async () => true,
        },
        spinner: {
            showSpinner: () => undefined,
            hideSpinner: () => undefined,
            setSpinnerParams: () => undefined,
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
            toggleSidebar,
            setToggleSidebar,
            theme,
            setTheme,
            toggleTheme: () => setTheme((current) => current === "light" ? "dark" : "light"),
            typography,
            setTypography,
            fileModified,
            setFileModified,
        },
    };

    return <AppContext.Provider value={value}>{props.children}</AppContext.Provider>;
}
