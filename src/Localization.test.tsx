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
            <button type="button" onClick={() => setLocale("es")}>Spanish</button>
        </>
    );
}

describe("I18NProvider", () => {
    let dispose: (() => void) | undefined;

    beforeEach(() => {
        window.localStorage.clear();
        window.localStorage.setItem("minieditor.locale", "en");
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

        root.querySelector<HTMLButtonElement>("button")?.click();

        expect(root.querySelector('[data-testid="locale"]')?.textContent).toBe("es");
        expect(root.querySelector('[data-testid="translation"]')?.textContent).toBe("Idioma");
        expect(document.documentElement.lang).toBe("es");
        expect(window.localStorage.getItem("minieditor.locale")).toBe("es");
    });
});
