/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { onCleanup, onMount, type JSX } from "solid-js";
import { useAppContext } from "../AppContext";
import Sidebar from "./Sidebar";

export type AppSidebarProps = {
    children: JSX.Element;
    disabled?: boolean;
};

export function AppSidebar(props: AppSidebarProps): JSX.Element {
    const {
        editor: { sidebarVisible, setSidebarVisible, setToggleSidebar },
    } = useAppContext();
    const toggleSidebar = (): void => {
        setSidebarVisible((visible) => !visible);
    };

    onMount(() => setToggleSidebar(toggleSidebar));
    onCleanup(() => setToggleSidebar(null));

    return (
        <Sidebar visible={sidebarVisible()} disabled={props.disabled}>
            {props.children}
        </Sidebar>
    );
}

export default AppSidebar;
