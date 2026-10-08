/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import type { JSX } from "solid-js";
import styles from "./ToggleSwitch.module.css";

export type ToggleSwitchSize = "small" | "medium" | "large";

export type ToggleSwitchProps = {
    label: JSX.Element;
    checked: boolean;
    size?: ToggleSwitchSize;
    disabled?: boolean;
    onChange: (checked: boolean) => void;
};

export function ToggleSwitch(props: ToggleSwitchProps): JSX.Element {
    const size = (): ToggleSwitchSize => props.size ?? "medium";

    return (
        <label
            class={styles.root}
            classList={{
                [styles.small]: size() === "small",
                [styles.medium]: size() === "medium",
                [styles.large]: size() === "large",
                [styles.disabled]: Boolean(props.disabled),
            }}
        >
            <input
                class={styles.input}
                type="checkbox"
                role="switch"
                checked={props.checked}
                disabled={props.disabled}
                onChange={(event) => props.onChange(event.currentTarget.checked)}
            />
            <span class={styles.track} aria-hidden="true">
                <span class={styles.thumb} />
            </span>
            <span class={styles.label}>{props.label}</span>
        </label>
    );
}

export default ToggleSwitch;
