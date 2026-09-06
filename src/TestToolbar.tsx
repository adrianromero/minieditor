/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { useAppContext } from "./AppContext";
import styles from "./TestToolbar.module.css";

export function TestToolbar() {
    const {
        main: { setFilename },
    } = useAppContext();
    return (
        <header class={styles.testToolbar}>
            <button onClick={() => setFilename("NONEXISTING.md")}>
                <span>Open NONEXISTING</span>
            </button>
            <button onClick={() => setFilename("")}>
                <span>Open Folder</span>
            </button>
            <button onClick={() => setFilename("README.md")}>
                <span>Open README</span>
            </button>
        </header>
    );
}

export default TestToolbar;
