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

    const renderNavigation = () => {
        const root = document.createElement("div");
        document.body.append(root);
        dispose = render(() => <FileNavigation />, root);
        return {
            back: root.querySelector<HTMLButtonElement>('[aria-label="toolbar.back"]'),
            forward: root.querySelector<HTMLButtonElement>('[aria-label="toolbar.forward"]'),
        };
    };

    afterEach(() => {
        dispose?.();
        dispose = undefined;
        document.body.replaceChildren();
        setBasepath("/first");
        setFilename("");
        loadFilename.mockClear();
    });

    it("uses the borderless main bar button style", () => {
        const { back, forward } = renderNavigation();

        expect(back?.classList.contains("mainbar")).toBe(true);
        expect(forward?.classList.contains("mainbar")).toBe(true);
        expect(back?.classList.contains("toolbar")).toBe(false);
        expect(forward?.classList.contains("toolbar")).toBe(false);
    });

    it("navigates backward and forward without deleting history", () => {
        const { back, forward } = renderNavigation();

        setFilename("first.md");
        setFilename("second.md");

        back?.click();
        expect(filename()).toBe("first.md");
        expect(back?.disabled).toBe(false);
        expect(forward?.disabled).toBe(false);

        forward?.click();
        expect(filename()).toBe("second.md");
        expect(forward?.disabled).toBe(true);
        expect(loadFilename).toHaveBeenNthCalledWith(1, "first.md");
        expect(loadFilename).toHaveBeenNthCalledWith(2, "second.md");
    });

    it("discards forward history when a different file is opened", () => {
        const { back, forward } = renderNavigation();

        setFilename("first.md");
        setFilename("second.md");
        back?.click();
        setFilename("branch.md");

        expect(forward?.disabled).toBe(true);
        back?.click();
        expect(filename()).toBe("first.md");
    });

    it("clears navigation history when the base path changes", () => {
        const { back, forward } = renderNavigation();

        setFilename("notes.md");
        expect(back?.disabled).toBe(false);

        batch(() => {
            setBasepath("/second");
            setFilename("");
        });
        expect(back?.disabled).toBe(true);
        expect(forward?.disabled).toBe(true);
    });
});
