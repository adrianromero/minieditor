/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import RootContent from "./RootContent";
import Toolbar from "./Toolbar";
import styles from "./App.module.css";
import { AppProvider } from "./AppContext";
import I18NProvider from "./Localization";

type AppProps = {
    initialBasepath: string;
    initialFilename: string;
};

function App(props: AppProps) {
    return (
        <I18NProvider>
            <AppProvider
                initialBasepath={props.initialBasepath}
                initialFilename={props.initialFilename}
            >
                <main class={styles.appMain}>
                    <Toolbar />
                    <RootContent />
                </main>
            </AppProvider>
        </I18NProvider>
    );
}

export default App;
