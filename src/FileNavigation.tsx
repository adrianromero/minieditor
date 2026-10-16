/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import ArrowLeft from "lucide-solid/icons/arrow-left";
import ArrowRight from "lucide-solid/icons/arrow-right";
import { batch, createEffect, createSignal, JSX } from "solid-js";
import { useAppContext } from "./AppContext";
import { useI18N } from "./Localization";

export function FileNavigation(): JSX.Element {
    const { t } = useI18N();
    const {
        main: { basepath, filename, loadFilename },
    } = useAppContext();
    const [filenameHistory, setFilenameHistory] = createSignal<string[]>([filename()]);
    const [historyIndex, setHistoryIndex] = createSignal(0);
    let lastObservedFilename = filename();
    let lastObservedBasepath = basepath();
    let historyNavigationTarget: { filename: string; index: number } | undefined;

    createEffect(() => {
        const currentBasepath = basepath();
        const currentFilename = filename();
        if (currentBasepath !== lastObservedBasepath) {
            lastObservedBasepath = currentBasepath;
            lastObservedFilename = currentFilename;
            historyNavigationTarget = undefined;
            batch(() => {
                setFilenameHistory([currentFilename]);
                setHistoryIndex(0);
            });
            return;
        }
        if (currentFilename === lastObservedFilename) {
            return;
        }

        lastObservedFilename = currentFilename;
        if (currentFilename === historyNavigationTarget?.filename) {
            setHistoryIndex(historyNavigationTarget.index);
            historyNavigationTarget = undefined;
            return;
        }

        historyNavigationTarget = undefined;
        const retainedHistory = filenameHistory().slice(0, historyIndex() + 1);
        batch(() => {
            setFilenameHistory([...retainedHistory, currentFilename]);
            setHistoryIndex(retainedHistory.length);
        });
    });

    const navigateHistory = async (nextIndex: number): Promise<void> => {
        const history = filenameHistory();
        if (nextIndex < 0 || nextIndex >= history.length || nextIndex === historyIndex()) {
            return;
        }

        const target = history[nextIndex];
        if (target === undefined) {
            return;
        }

        historyNavigationTarget = { filename: target, index: nextIndex };
        await loadFilename(target);

        if (filename() !== target) {
            historyNavigationTarget = undefined;
        }
    };

    return (
        <>
            <button
                type="button"
                class="stdButton mainbar"
                disabled={historyIndex() <= 0}
                aria-label={t("toolbar.back")}
                title={t("toolbar.back")}
                onClick={() => void navigateHistory(historyIndex() - 1)}
            >
                <ArrowLeft class="actionIcon" aria-hidden="true" />
            </button>
            <button
                type="button"
                class="stdButton mainbar"
                disabled={historyIndex() >= filenameHistory().length - 1}
                aria-label={t("toolbar.forward")}
                title={t("toolbar.forward")}
                onClick={() => void navigateHistory(historyIndex() + 1)}
            >
                <ArrowRight class="actionIcon" aria-hidden="true" />
            </button>
        </>
    );
}

export default FileNavigation;
