/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import * as i18n from "@solid-primitives/i18n";
import {
    createContext,
    createEffect,
    createMemo,
    createSignal,
    useContext,
    type Accessor,
    type ParentComponent,
    type Setter,
} from "solid-js";

import en from "./i18n/en.json";
import es from "./i18n/es.json";

const dictionaries = { en, es };
export type Locale = keyof typeof dictionaries;

function getSystemLocale(): Locale {
    const systemLocale = navigator.languages[0] ?? navigator.language;
    const language = systemLocale.split("-")[0].toLowerCase();

    return language in dictionaries ? (language as Locale) : "en";
}

type I18NContextValue = {
    t: i18n.Translator<i18n.Flatten<typeof en>, string>;
    locale: Accessor<Locale>;
    setLocale: Setter<Locale>;
};

export type Translator = I18NContextValue["t"];

const I18NContext = createContext<I18NContextValue>();

const I18NProvider: ParentComponent = props => {
    const [locale, setLocale] = createSignal<Locale>(getSystemLocale());
    const dictionary = createMemo(() => i18n.flatten(dictionaries[locale()]));
    const t = i18n.translator(dictionary, i18n.resolveTemplate);

    createEffect(() => {
        document.documentElement.lang = locale();
    });

    return (
        <I18NContext.Provider value={{ t, locale, setLocale }}>
            {props.children}
        </I18NContext.Provider>
    );
};

export function useI18N() {
    const context = useContext(I18NContext);
    if (!context) {
        throw new Error("useI18N must be used inside I18NProvider");
    }
    return context;
}

export default I18NProvider;
