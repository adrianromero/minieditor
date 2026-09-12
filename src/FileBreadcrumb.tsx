/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { createMemo, For, JSX, Show } from "solid-js";
import { useAppContext } from "./AppContext";
import { useI18N } from "./Localization";
import styles from "./FileBreadcrumb.module.css";

type BreadcrumbSegment = {
    name: string;
    filename: string;
};

export function FileBreadcrumb(): JSX.Element {
    const { t } = useI18N();
    const {
        main: { filename, loadFilename },
    } = useAppContext();

    const segments = createMemo<BreadcrumbSegment[]>(() => {
        const names = filename().split(/[\\/]+/).filter(Boolean);
        return names.map((name, index) => ({
            name,
            filename: names.slice(0, index + 1).join("/"),
        }));
    });

    return (
        <nav class={styles.breadcrumb} aria-label={t("toolbar.pathNavigation")}>
            <span class={styles.fileIcon} aria-hidden="true">
                📄
            </span>
            <Show
                when={segments().length > 0}
                fallback={<span class={styles.currentSegment}>{t("toolbar.basePath")}</span>}
            >
                <button
                    type="button"
                    class={styles.segmentLink}
                    onClick={() => void loadFilename("")}
                >
                    {t("toolbar.basePath")}
                </button>
                <span class={styles.separator} aria-hidden="true">
                    /
                </span>
                <For each={segments()}>
                    {(segment, index) => (
                        <>
                            <Show
                                when={index() < segments().length - 1}
                                fallback={
                                    <span class={styles.currentSegment}>{segment.name}</span>
                                }
                            >
                                <button
                                    type="button"
                                    class={styles.segmentLink}
                                    onClick={() => void loadFilename(segment.filename)}
                                >
                                    {segment.name}
                                </button>
                            </Show>
                            <Show when={index() < segments().length - 1}>
                                <span class={styles.separator} aria-hidden="true">
                                    /
                                </span>
                            </Show>
                        </>
                    )}
                </For>
            </Show>
        </nav>
    );
}

export default FileBreadcrumb;
