/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { render } from "solid-js/web";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import I18NProvider, { useI18N } from "./Localization";

function LocaleControl() {
    const { locale, setLocale, t } = useI18N();

    return (
        <>
            <span data-testid="locale">{locale()}</span>
            <span data-testid="translation">{t("toolbar.language")}</span>
            <button type="button" data-locale="es" onClick={() => setLocale("es")}>Spanish</button>
            <button type="button" data-locale="ca" onClick={() => setLocale("ca")}>Catalan</button>
            <button type="button" data-locale="gl" onClick={() => setLocale("gl")}>Galician</button>
            <button type="button" data-locale="eu" onClick={() => setLocale("eu")}>Basque</button>
        </>
    );
}

describe("I18NProvider", () => {
    let dispose: (() => void) | undefined;

    beforeEach(() => {
        window.localStorage.clear();
        window.localStorage.setItem("plunibio.locale", "en");
    });

    afterEach(() => {
        dispose?.();
        dispose = undefined;
        document.body.replaceChildren();
        window.localStorage.clear();
    });

    it("updates translations and persists a selected locale", () => {
        const root = document.createElement("div");
        document.body.append(root);
        dispose = render(
            () => (
                <I18NProvider>
                    <LocaleControl />
                </I18NProvider>
            ),
            root
        );

        expect(root.querySelector('[data-testid="locale"]')?.textContent).toBe("en");
        expect(root.querySelector('[data-testid="translation"]')?.textContent).toBe("Language");

        root.querySelector<HTMLButtonElement>('[data-locale="es"]')?.click();

        expect(root.querySelector('[data-testid="locale"]')?.textContent).toBe("es");
        expect(root.querySelector('[data-testid="translation"]')?.textContent).toBe("Idioma");
        expect(document.documentElement.lang).toBe("es");
        expect(window.localStorage.getItem("plunibio.locale")).toBe("es");

        for (const [nextLocale, translation] of [
            ["ca", "Idioma"],
            ["gl", "Idioma"],
            ["eu", "Hizkuntza"],
        ] as const) {
            root.querySelector<HTMLButtonElement>(`[data-locale="${nextLocale}"]`)?.click();

            expect(root.querySelector('[data-testid="locale"]')?.textContent).toBe(nextLocale);
            expect(root.querySelector('[data-testid="translation"]')?.textContent).toBe(
                translation
            );
            expect(document.documentElement.lang).toBe(nextLocale);
            expect(window.localStorage.getItem("plunibio.locale")).toBe(nextLocale);
        }
    });
});
