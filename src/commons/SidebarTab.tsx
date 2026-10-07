/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import {
    createContext,
    createSignal,
    Show,
    useContext,
    type Accessor,
    type JSX,
} from "solid-js";
import styles from "./SidebarTab.module.css";

export type SidebarTabProps = {
    children: JSX.Element;
    defaultKey?: string;
    selectedKey?: string;
    onSelectedKeyChange?: (key: string | undefined) => void;
};

export type SidebarTabContextValue = {
    selectedKey: Accessor<string | undefined>;
    setSelectedKey: (key: string | undefined) => void;
    register: (key: string) => void;
    tabList: HTMLDivElement;
};

export const SidebarTabContext = createContext<SidebarTabContextValue>();

export function useSidebarTab(): SidebarTabContextValue {
    const context = useContext(SidebarTabContext);
    if (!context) throw new Error("SidebarTabSection must be used inside SidebarTab.");
    return context;
}

export function SidebarTab(props: SidebarTabProps): JSX.Element {
    const [internalSelectedKey, setInternalSelectedKey] = createSignal<string | undefined>(
        props.defaultKey
    );
    const [tabList, setTabList] = createSignal<HTMLDivElement>();
    const registeredKeys = new Set<string>();
    const selectedKey = (): string | undefined => props.selectedKey ?? internalSelectedKey();
    const setSelectedKey = (key: string | undefined): void => {
        setInternalSelectedKey(key);
        props.onSelectedKeyChange?.(key);
    };

    const register = (key: string): void => {
        if (registeredKeys.has(key)) return;
        registeredKeys.add(key);
        if (selectedKey() === undefined) setSelectedKey(key);
    };

    return (
        <div class={styles.tabbedSidebar}>
            <div ref={setTabList} class={`tabs ${styles.tabList}`} role="tablist" />
            <Show when={tabList()}>
                {(resolvedTabList) => (
                    <SidebarTabContext.Provider
                        value={{
                            selectedKey,
                            setSelectedKey,
                            register,
                            tabList: resolvedTabList(),
                        }}
                    >
                        {props.children}
                    </SidebarTabContext.Provider>
                )}
            </Show>
        </div>
    );
}

export default SidebarTab;
