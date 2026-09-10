/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faCircleInfo, faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import { createEffect, createUniqueId, JSX } from "solid-js";
import styles from "./Dialog.module.css";
import AppIcon from "./AppIcon";

type DialogStyle = "errorStyleError" | "errorStyleStatus";

type DialogProps = {
    open: boolean;
    title: string;
    message: JSX.Element;
    style?: DialogStyle;
    closeLabel: string;
    onClose: () => void;
};

export function Dialog(props: DialogProps): JSX.Element {
    let dialogRef!: HTMLDialogElement;
    const titleId = createUniqueId();
    const style = (): DialogStyle => props.style ?? "errorStyleError";
    const icon = (): IconDefinition =>
        style() === "errorStyleError" ? faCircleXmark : faCircleInfo;

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
            class={`${styles.dialog} ${styles[style()]}`}
            aria-labelledby={titleId}
            onClose={props.onClose}
        >
            <div class={styles.iconRow}>
                <AppIcon icon={icon()} class={styles.icon} />
            </div>
            <h2 id={titleId} class={styles.title}>
                {props.title}
            </h2>
            <div class={styles.message}>{props.message}</div>
            <div class={styles.actions}>
                <button class="appButton" type="button" onClick={() => dialogRef.close()}>
                    {props.closeLabel}
                </button>
            </div>
        </dialog>
    );
}

export default Dialog;
