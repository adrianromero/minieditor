/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import type { JSX } from "solid-js";
import styles from "./Sidebar.module.css";

export type SidebarProps = {
    children: JSX.Element;
};

export function Sidebar(props: SidebarProps): JSX.Element {
    return <aside class={styles.sidebar}>{props.children}</aside>;
}

export default Sidebar;
