/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

export const APP_LOCALES = ["en", "es", "ca", "gl", "eu"] as const;
export type AppLocale = (typeof APP_LOCALES)[number];

const LOCALE_KEY = "minieditor.locale";

type LocalePreferenceReader = Pick<Storage, "getItem">;
type LocalePreferenceWriter = Pick<Storage, "setItem">;
type SystemLocaleSource = Pick<Navigator, "language" | "languages">;

function isAppLocale(value: string | null): value is AppLocale {
    return APP_LOCALES.some(locale => locale === value);
}

export function getSystemLocale(source: SystemLocaleSource = navigator): AppLocale {
    const systemLocale = source.languages[0] ?? source.language;
    const language = systemLocale.split("-")[0]?.toLowerCase() ?? "";

    return isAppLocale(language) ? language : "en";
}

export function loadLocale(
    storage?: LocalePreferenceReader,
    source?: SystemLocaleSource
): AppLocale {
    try {
        const storedLocale = (storage ?? window.localStorage).getItem(LOCALE_KEY);
        return isAppLocale(storedLocale) ? storedLocale : getSystemLocale(source);
    } catch (error: unknown) {
        console.error("Unable to load locale:", error);
        return getSystemLocale(source);
    }
}

export function saveLocale(locale: AppLocale, storage?: LocalePreferenceWriter): void {
    try {
        (storage ?? window.localStorage).setItem(LOCALE_KEY, locale);
    } catch (error: unknown) {
        console.error("Unable to save locale:", error);
    }
}
