/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faCircleInfo, faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import { JSX } from "solid-js";
import styles from "./ErrorView.module.css";

type ErrorViewProps = {
    children: JSX.Element;
    style?: "errorStyleError" | "errorStyleStatus";
};

export function ErrorView(props: ErrorViewProps): JSX.Element {
    const style = (): NonNullable<ErrorViewProps["style"]> => props.style ?? "errorStyleError";
    const icon = (): IconDefinition =>
        style() === "errorStyleError" ? faCircleXmark : faCircleInfo;

    return (
        <section class={styles.errorView}>
            <div class={`${styles.errorContent} ${styles[style()]}`}>
                <svg
                    class={styles.errorIcon}
                    viewBox={`0 0 ${icon().icon[0]} ${icon().icon[1]}`}
                    aria-hidden="true"
                >
                    <path fill="currentColor" d={icon().icon[4] as string} />
                </svg>
                <div>{props.children}</div>
            </div>
        </section>
    );
}

export default ErrorView;
