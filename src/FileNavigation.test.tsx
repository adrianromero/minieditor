/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { batch, createSignal } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";
import FileNavigation from "./FileNavigation";

const [basepath, setBasepath] = createSignal("/first");
const [filename, setFilename] = createSignal("");
const loadFilename = vi.fn(async (nextFilename: string) => {
    setFilename(nextFilename);
});

vi.mock("./AppContext", () => ({
    useAppContext: () => ({ main: { basepath, filename, loadFilename } }),
}));
vi.mock("./Localization", () => ({
    useI18N: () => ({ t: (key: string) => key }),
}));

describe("FileNavigation", () => {
    let dispose: (() => void) | undefined;

    afterEach(() => {
        dispose?.();
        dispose = undefined;
        document.body.replaceChildren();
        setBasepath("/first");
        setFilename("");
        loadFilename.mockClear();
    });

    it("clears back history when the base path changes", () => {
        const root = document.createElement("div");
        document.body.append(root);
        dispose = render(() => <FileNavigation />, root);
        const back = root.querySelector<HTMLButtonElement>("button");

        setFilename("notes.md");
        expect(back?.disabled).toBe(false);

        batch(() => {
            setBasepath("/second");
            setFilename("");
        });
        expect(back?.disabled).toBe(true);
    });
});
