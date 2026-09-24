/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { createSignal, type JSX } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { ExternalLink } from "lucide-solid";
import { translateAppError } from "../AppError";
import { useAppContext } from "../AppContext";
import { useI18N } from "../Localization";
import styles from "./ExternalFileView.module.css";

export function EditorExternalFile(): JSX.Element {
    const { t } = useI18N();
    const {
        main: { basepath, filename, showAppMessage },
    } = useAppContext();
    const [opening, setOpening] = createSignal(false);

    const openFile = async (): Promise<void> => {
        if (opening()) {
            return;
        }

        setOpening(true);
        try {
            await invoke("open_file", {
                basepath: basepath(),
                filename: filename(),
            });
        } catch (error: unknown) {
            console.error("Unable to open file with the operating system:", error);
            await showAppMessage(translateAppError(error, t), "error");
        } finally {
            setOpening(false);
        }
    };

    return (
        <section class="scrollingView">
            <div class={`contentView ${styles.externalFile}`}>
                <button
                    class="stdButton"
                    type="button"
                    disabled={opening()}
                    onClick={() => void openFile()}
                >
                    <ExternalLink class="actionIcon" aria-hidden="true" />
                    <span>{t(opening() ? "externalFile.opening" : "externalFile.open")}</span>
                </button>
            </div>
        </section>
    );
}

export default EditorExternalFile;
