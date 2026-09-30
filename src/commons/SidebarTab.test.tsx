/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";
import Sidebar from "./Sidebar";
import SidebarTab from "./SidebarTab";
import SidebarTabSection from "./SidebarTabSection";

describe("SidebarTab", () => {
    let dispose: (() => void) | undefined;

    afterEach(() => {
        dispose?.();
        dispose = undefined;
        document.body.replaceChildren();
    });

    it("selects the first section and changes the active section", () => {
        const root = document.createElement("div");
        document.body.append(root);
        dispose = render(
            () => (
                <Sidebar>
                    <SidebarTab>
                        <SidebarTabSection key="first" label="First">
                            First content
                        </SidebarTabSection>
                        <SidebarTabSection key="second" label="Second">
                            Second content
                        </SidebarTabSection>
                    </SidebarTab>
                </Sidebar>
            ),
            root
        );

        const tabs = root.querySelectorAll<HTMLButtonElement>("[role=tab]");
        expect(tabs).toHaveLength(2);
        expect(tabs[0].getAttribute("aria-selected")).toBe("true");
        expect(root.querySelector("[role=tabpanel]")?.textContent).toContain("First content");

        tabs[1].click();

        expect(tabs[0].getAttribute("aria-selected")).toBe("false");
        expect(tabs[1].getAttribute("aria-selected")).toBe("true");
        expect(root.querySelector("[role=tabpanel]")?.textContent).toContain("Second content");
    });
});
