/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { render } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";
import ToggleSwitch from "./ToggleSwitch";

describe("ToggleSwitch", () => {
    let dispose: (() => void) | undefined;

    afterEach(() => {
        dispose?.();
        dispose = undefined;
        document.body.replaceChildren();
    });

    it("renders an accessible switch and reports changes", () => {
        const root = document.createElement("div");
        const onChange = vi.fn();
        document.body.append(root);
        dispose = render(
            () => <ToggleSwitch label="Notifications" checked={false} onChange={onChange} />,
            root
        );

        const input = root.querySelector<HTMLInputElement>('input[role="switch"]');
        expect(input?.checked).toBe(false);
        expect(input?.disabled).toBe(false);
        expect(root.textContent).toContain("Notifications");

        input?.click();

        expect(onChange).toHaveBeenCalledOnce();
        expect(onChange).toHaveBeenCalledWith(true);
    });

    it("prevents changes when disabled", () => {
        const root = document.createElement("div");
        const onChange = vi.fn();
        document.body.append(root);
        dispose = render(
            () => (
                <ToggleSwitch
                    label="Notifications"
                    checked={true}
                    size="large"
                    disabled
                    onChange={onChange}
                />
            ),
            root
        );

        const input = root.querySelector<HTMLInputElement>('input[role="switch"]');
        expect(input?.checked).toBe(true);
        expect(input?.disabled).toBe(true);

        input?.click();

        expect(onChange).not.toHaveBeenCalled();
    });
});
