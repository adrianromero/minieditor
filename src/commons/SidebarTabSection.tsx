/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { createUniqueId, Show, type JSX } from "solid-js";
import { Portal } from "solid-js/web";
import { useSidebarDisabled } from "./Sidebar";
import { useSidebarTab } from "./SidebarTab";

export type SidebarTabSectionProps = {
    key: string;
    label: JSX.Element;
    children: JSX.Element;
};

export function SidebarTabSection(props: SidebarTabSectionProps): JSX.Element {
    const tabs = useSidebarTab();
    const sidebarDisabled = useSidebarDisabled();
    const id = createUniqueId();
    const tabId = `sidebar-tab-${id}`;
    const panelId = `sidebar-tab-panel-${id}`;
    const current = (): boolean => tabs.selectedKey() === props.key;
    const selected = (): boolean => current() && !sidebarDisabled();

    tabs.register(props.key);

    return (
        <>
            <Portal mount={tabs.tabList}>
                <button
                    id={tabId}
                    type="button"
                    role="tab"
                    class={`stdButton tab ${selected() ? "selected" : ""}`}
                    aria-controls={panelId}
                    aria-selected={selected()}
                    disabled={sidebarDisabled()}
                    onClick={() => tabs.setSelectedKey(props.key)}
                >
                    {props.label}
                </button>
            </Portal>
            <Show when={current()}>
                <div
                    id={panelId}
                    class="sidebarPanel"
                    role="tabpanel"
                    aria-labelledby={tabId}
                >
                    {props.children}
                </div>
            </Show>
        </>
    );
}

export default SidebarTabSection;
