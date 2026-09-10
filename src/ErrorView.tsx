/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faCircleInfo, faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import { JSX } from "solid-js";
import styles from "./ErrorView.module.css";
import AppIcon from "./AppIcon";
import { useI18N } from "./Localization";

type ErrorViewProps = {
    children: JSX.Element;
    style?: "errorStyleError" | "errorStyleStatus";
};

export function ErrorView(props: ErrorViewProps): JSX.Element {
    const { t } = useI18N();

    const style = (): NonNullable<ErrorViewProps["style"]> => props.style ?? "errorStyleError";
    const icon = (): IconDefinition =>
        style() === "errorStyleError" ? faCircleXmark : faCircleInfo;

    return (
        <section class={`${styles.errorView} ${styles[style()]}`}>
            <div class={styles.errorContent}>
                <AppIcon icon={icon()} class={styles.icon} />
                <div class={styles.title}>{t("dialog.errorTitle")}</div>
                <div class={styles.message}>{props.children}</div>
            </div>
        </section>
    );
}

export default ErrorView;
