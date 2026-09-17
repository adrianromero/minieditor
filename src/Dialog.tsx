/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { createEffect, createUniqueId, JSX } from "solid-js";
import styles from "./Dialog.module.css";
import AppIcon from "./AppIcon";
import { messagesinfo, type MessageInfo, type MessageInfoKind } from "./messagesinfo";
import { useI18N } from "./Localization";

type DialogProps = {
    open: boolean;
    message: JSX.Element;
    info?: MessageInfoKind;
    onCancel: () => void;
    cancelLabel?: string;
    onConfirm?: () => void;
    confirmLabel?: string;
    onClose?: () => void;
};

export function Dialog(props: DialogProps): JSX.Element {
    const { t } = useI18N();
    let dialogRef!: HTMLDialogElement;
    const titleId = createUniqueId();
    const kind = (): MessageInfoKind => props.info ?? "error";
    const info = (): MessageInfo => messagesinfo[kind()];

    createEffect(() => {
        if (props.open && !dialogRef.open) {
            dialogRef.showModal();
        } else if (!props.open && dialogRef.open) {
            dialogRef.close();
        }
    });

    return (
        <dialog
            ref={dialogRef}
            class={`${styles.dialog} ${styles[info().class]}`}
            aria-labelledby={titleId}
            onCancel={(e) => {
                e.preventDefault();
                props.onCancel?.();
            }}
            onClose={() => {
                props.onClose?.();
            }}
        >
            <div class={styles.iconRow}>
                <AppIcon icon={info().icon} class={styles.icon} />
            </div>
            <h2 id={titleId} class={styles.title}>
                {t(info().literal)}
            </h2>
            <div class={styles.message}>{props.message}</div>
            <div class={styles.actions}>
                {props.confirmLabel ? (
                    <button
                        class="stdButton"
                        type="button"
                        onClick={() => {
                            void props.onConfirm?.();
                        }}
                    >
                        {props.confirmLabel ?? t("dialog.confirm")}
                    </button>
                ) : null}
                {props.cancelLabel ? (
                    <button class="stdButton" type="button" onClick={() => void props.onCancel()}>
                        {props.cancelLabel}
                    </button>
                ) : null}
            </div>
        </dialog>
    );
}

export default Dialog;
