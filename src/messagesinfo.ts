/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faCircleInfo, faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import type { TranslationKey } from "./Localization";

export type MessageInfo = Readonly<{
    icon: IconDefinition;
    literal: TranslationKey;
    class: "styleError" | "styleStatus";
}>;

export const messagesinfo = {
    status: {
        icon: faCircleInfo,
        literal: "dialog.errorTitle",
        class: "styleStatus",
    },
    error: {
        icon: faCircleXmark,
        literal: "dialog.errorTitle",
        class: "styleError",
    },
} as const satisfies Readonly<Record<string, MessageInfo>>;

export type MessageInfoKind = keyof typeof messagesinfo;
