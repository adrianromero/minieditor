/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import type { JSX, ParentProps } from "solid-js";
import styles from "./ToolbarView.module.css";

export function ToolbarView(props: ParentProps): JSX.Element {
    return (
        <div class={styles.toolbarView} role="toolbar">
            {props.children}
        </div>
    );
}

export default ToolbarView;
