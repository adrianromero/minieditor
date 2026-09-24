/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import ArrowLeft from "lucide-solid/icons/arrow-left";
import { createEffect, createSignal, JSX } from "solid-js";
import { useAppContext } from "./AppContext";
import { useI18N } from "./Localization";

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
            class="stdButton toolbar"
            disabled={filenameHistory().length <= 1}
            aria-label={t("toolbar.back")}
            title={t("toolbar.back")}
            onClick={() => void navigateBack()}
        >
            <ArrowLeft class="actionIcon" aria-hidden="true" />
        </button>
    );
}

export default FileNavigation;
