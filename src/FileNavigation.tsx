/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { createEffect, createSignal, JSX } from "solid-js";
import AppIcon from "./AppIcon";
import { useAppContext } from "./AppContext";
import { useI18N } from "./Localization";
import styles from "./FileNavigation.module.css";

export function FileNavigation(): JSX.Element {
    const { t } = useI18N();
    const {
        main: { filename, loadFilename },
    } = useAppContext();
    const [filenameHistory, setFilenameHistory] = createSignal<string[]>([filename()]);
    let lastObservedFilename = filename();
    let backNavigationTarget: string | undefined;

    createEffect(() => {
        const currentFilename = filename();
        if (currentFilename === lastObservedFilename) {
            return;
        }

        lastObservedFilename = currentFilename;
        if (currentFilename === backNavigationTarget) {
            setFilenameHistory((history) => history.slice(0, -1));
            backNavigationTarget = undefined;
            return;
        }

        backNavigationTarget = undefined;
        setFilenameHistory((history) => [...history, currentFilename]);
    });

    const navigateBack = async (): Promise<void> => {
        const history = filenameHistory();
        if (history.length <= 1) {
            return;
        }

        const target = history[history.length - 2];
        if (target === undefined) {
            return;
        }

        backNavigationTarget = target;
        await loadFilename(target);

        if (filename() !== target) {
            backNavigationTarget = undefined;
        }
    };

    return (
        <button
            type="button"
            class={styles.backButton}
            disabled={filenameHistory().length <= 1}
            aria-label={t("toolbar.back")}
            title={t("toolbar.back")}
            onClick={() => void navigateBack()}
        >
            <AppIcon icon={faArrowLeft} class={styles.backIcon} />
        </button>
    );
}

export default FileNavigation;
