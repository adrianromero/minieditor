/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ToggleSidebarHandler } from "../AppContext";
import AppSidebar from "./AppSidebar";

let sidebarContext: {
    sidebarVisible: () => boolean;
    setSidebarVisible: (value: boolean | ((visible: boolean) => boolean)) => boolean;
    setToggleSidebar: (handler: ToggleSidebarHandler | null) => void;
};

vi.mock("../AppContext", () => ({
    useAppContext: () => ({ editor: sidebarContext }),
}));

describe("AppSidebar", () => {
    let dispose: (() => void) | undefined;
    let toggleSidebar: ToggleSidebarHandler | null;

    beforeEach(() => {
        const [sidebarVisible, setSidebarVisible] = createSignal(true);
        toggleSidebar = null;
        sidebarContext = {
            sidebarVisible,
            setSidebarVisible,
            setToggleSidebar: (handler) => {
                toggleSidebar = handler;
            },
        };
    });

    afterEach(() => {
        dispose?.();
        dispose = undefined;
        document.body.replaceChildren();
    });

    it("registers the toggle and preserves visibility across remounts", () => {
        const firstRoot = document.createElement("div");
        document.body.append(firstRoot);
        dispose = render(() => <AppSidebar>Content</AppSidebar>, firstRoot);

        const firstAside = firstRoot.querySelector("aside");
        expect(toggleSidebar).not.toBeNull();
        expect(firstAside?.getAttribute("aria-hidden")).toBe("false");

        toggleSidebar?.();

        expect(firstAside?.getAttribute("aria-hidden")).toBe("true");
        expect(firstAside?.inert).toBe(true);

        dispose();
        dispose = undefined;
        expect(toggleSidebar).toBeNull();

        const secondRoot = document.createElement("div");
        document.body.append(secondRoot);
        dispose = render(() => <AppSidebar>Content</AppSidebar>, secondRoot);

        expect(secondRoot.querySelector("aside")?.getAttribute("aria-hidden")).toBe("true");
    });
});
