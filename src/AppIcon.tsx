/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { JSX } from "solid-js/jsx-runtime";

type AppIconProps = {
    icon: IconDefinition;
    class?: string;
};

export function AppIcon(props: AppIconProps): JSX.Element {
    return (
        <svg
            class={`appIcon ${props.class ?? ""}`}
            viewBox={`0 0 ${props.icon.icon[0]} ${props.icon.icon[1]}`}
            aria-hidden="true"
        >
            <path fill="currentColor" d={props.icon.icon[4] as string} />
        </svg>
    );
}

export default AppIcon;
