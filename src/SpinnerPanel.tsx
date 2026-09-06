/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { JSX } from "solid-js";
import styles from "./SpinnerPanel.module.css";

export type SpinnerPanelProps = {
    visible: boolean;
    text: string;
};

export function SpinnerPanel(props: SpinnerPanelProps): JSX.Element {
    return (
        <div
            class={styles.spinnerOverlay}
            classList={{ [styles.visible]: props.visible }}
            aria-hidden={!props.visible}
            aria-live="polite"
            aria-busy={props.visible}
        >
            <div class={styles.spinnerContent} role="status">
                <svg class={styles.spinnerIcon} viewBox="0 0 50 50" aria-hidden="true">
                    <circle class={styles.spinnerTrack} cx="25" cy="25" r="20" />
                    <circle class={styles.spinnerIndicator} cx="25" cy="25" r="20" />
                </svg>
                <span class={styles.spinnerText}>{props.text}</span>
            </div>
        </div>
    );
}

export default SpinnerPanel;
