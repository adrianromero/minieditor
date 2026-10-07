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
    visible?: boolean;
};

export function Sidebar(props: SidebarProps): JSX.Element {
    const visible = (): boolean => props.visible ?? true;
    const disabled = (): boolean => Boolean(props.disabled) || !visible();

    return (
        <SidebarDisabledContext.Provider value={disabled}>
            <div class={styles.sidebarSlot} classList={{ [styles.hidden]: !visible() }}>
                <aside
                    class={styles.sidebar}
                    classList={{ [styles.disabled]: props.disabled }}
                    aria-disabled={props.disabled}
                    aria-hidden={!visible()}
                    inert={disabled()}
                >
                    {props.children}
                </aside>
            </div>
        </SidebarDisabledContext.Provider>
    );
}

export default Sidebar;
