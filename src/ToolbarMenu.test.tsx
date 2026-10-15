/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";
import ToolbarMenu from "./ToolbarMenu";

describe("ToolbarMenu", () => {
    let dispose: (() => void) | undefined;

    afterEach(() => {
        dispose?.();
        dispose = undefined;
        document.body.replaceChildren();
    });

    it("runs an item action and closes the popover", () => {
        const root = document.createElement("div");
        document.body.append(root);
        const onSelect = vi.fn();
        const hidePopover = vi.fn();

        dispose = render(
            () => (
                <ToolbarMenu
                    label="More options"
                    blocks={[
                        { kind: "action", id: "one", label: "One", onSelect },
                        { kind: "action", id: "two", label: "Two", onSelect: vi.fn() },
                    ]}
                />
            ),
            root
        );

        const menu = root.querySelector<HTMLDivElement>('[role="menu"]');
        Object.defineProperty(menu, "hidePopover", { value: hidePopover });
        menu?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.click();

        expect(onSelect).toHaveBeenCalledOnce();
        expect(hidePopover).toHaveBeenCalledOnce();
        expect(menu?.querySelector('[role="group"]')).toBeNull();
    });

    it("moves focus through sections and standalone items in block order", () => {
        const root = document.createElement("div");
        document.body.append(root);

        dispose = render(
            () => (
                <ToolbarMenu
                    label="More options"
                    blocks={[
                        {
                            kind: "section",
                            id: "first",
                            label: "First section",
                            items: [
                                { kind: "action", id: "one", label: "One", onSelect: vi.fn() },
                                {
                                    kind: "action",
                                    id: "disabled",
                                    label: "Disabled",
                                    onSelect: vi.fn(),
                                    disabled: true,
                                },
                            ],
                        },
                        {
                            kind: "action",
                            id: "standalone",
                            label: "Standalone",
                            onSelect: vi.fn(),
                        },
                        {
                            kind: "section",
                            id: "second",
                            label: "Second section",
                            items: [
                                {
                                    kind: "action",
                                    id: "three",
                                    label: "Three",
                                    onSelect: vi.fn(),
                                },
                            ],
                        },
                    ]}
                />
            ),
            root
        );

        const menu = root.querySelector<HTMLDivElement>('[role="menu"]');
        const enabledItems = menu?.querySelectorAll<HTMLButtonElement>(
            '[role="menuitem"]:not(:disabled)'
        );
        const groups = menu?.querySelectorAll<HTMLElement>('[role="group"]');

        expect(groups).toHaveLength(2);
        expect(groups?.[0]?.getAttribute("aria-labelledby")).toBe(
            groups?.[0]?.firstElementChild?.id
        );
        expect(groups?.[0]?.firstElementChild?.textContent).toBe("First section");
        expect(groups?.[1]?.firstElementChild?.textContent).toBe("Second section");
        expect(groups?.[0]?.firstElementChild?.getAttribute("tabindex")).toBeNull();
        expect(enabledItems?.[1]?.dataset.toolbarMenuEntry).toBe("standalone");

        enabledItems?.[0]?.focus();
        menu?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));

        expect(document.activeElement).toBe(enabledItems?.[1]);

        menu?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
        expect(document.activeElement).toBe(enabledItems?.[2]);

        menu?.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
        expect(document.activeElement).toBe(enabledItems?.[0]);
    });

    it("renders and changes a single-choice entry", () => {
        const root = document.createElement("div");
        document.body.append(root);
        const [value, setValue] = createSignal<"first" | "second">("first");

        dispose = render(
            () => (
                <ToolbarMenu
                    label="More options"
                    blocks={[
                        {
                            kind: "section",
                            id: "main",
                            label: "Main",
                            items: [
                                {
                                    kind: "choice",
                                    id: "choice",
                                    label: "Choice",
                                    value,
                                    options: [
                                        {
                                            value: "first",
                                            label: "First",
                                            description: "First description",
                                        },
                                        { value: "second", label: "Second" },
                                    ],
                                    onChange: setValue,
                                },
                            ],
                        },
                    ]}
                />
            ),
            root
        );

        const entry = root.querySelector<HTMLButtonElement>(
            '[data-toolbar-menu-entry="choice"]'
        );
        const first = root.querySelector<HTMLButtonElement>('[data-choice-option="first"]');
        const second = root.querySelector<HTMLButtonElement>('[data-choice-option="second"]');

        expect(entry?.textContent).toContain("First");
        expect(first?.textContent).toBe("FirstFirst description");
        expect(first?.getAttribute("aria-checked")).toBe("true");
        expect(second?.getAttribute("aria-checked")).toBe("false");
        expect(root.querySelector(".lucide-check")).toBeNull();

        second?.click();

        expect(value()).toBe("second");
        expect(entry?.textContent).toContain("Second");
        expect(first?.getAttribute("aria-checked")).toBe("false");
        expect(second?.getAttribute("aria-checked")).toBe("true");
    });
});
