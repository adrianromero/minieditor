/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { JSX } from "solid-js";
import styles from "./ErrorView.module.css";
import { Dynamic } from "solid-js/web";
import { messagesinfo, type MessageInfoKind, type MessageInfo } from "../messagesinfo";
import { useI18N } from "../Localization";

type ErrorViewProps = {
    children: JSX.Element;
    info?: MessageInfoKind;
};

export function ErrorView(props: ErrorViewProps): JSX.Element {
    const { t } = useI18N();

    const kind = (): MessageInfoKind => props.info ?? "error";
    const info = (): MessageInfo => messagesinfo[kind()];

    return (
        <section class={`${styles.errorView} ${styles[info().class]}`}>
            <div class={styles.errorContent}>
                <Dynamic component={info().icon} class={styles.icon} aria-hidden="true" />
                <div class={styles.title}>{t(info().literal)}</div>
                <div class={styles.message}>{props.children}</div>
            </div>
        </section>
    );
}

export default ErrorView;
