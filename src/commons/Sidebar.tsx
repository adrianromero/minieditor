/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { createContext, useContext, type Accessor, type JSX } from "solid-js";
import styles from "./Sidebar.module.css";

const SidebarDisabledContext = createContext<Accessor<boolean>>(() => false);

export function useSidebarDisabled(): Accessor<boolean> {
    return useContext(SidebarDisabledContext);
}

export type SidebarProps = {
    children: JSX.Element;
    disabled?: boolean;
};

export function Sidebar(props: SidebarProps): JSX.Element {
    return (
        <SidebarDisabledContext.Provider value={() => props.disabled ?? false}>
            <aside
                class={styles.sidebar}
                classList={{ [styles.disabled]: props.disabled }}
                aria-disabled={props.disabled}
                inert={props.disabled}
            >
                {props.children}
            </aside>
        </SidebarDisabledContext.Provider>
    );
}

export default Sidebar;
