/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import type { LucideIcon } from "lucide-solid";
import Info from "lucide-solid/icons/info";
import CircleX from "lucide-solid/icons/circle-x";
import CircleQuestionMark from "lucide-solid/icons/circle-question-mark";
import type { TranslationKey } from "./Localization";

export type MessageInfo = Readonly<{
    icon: LucideIcon;
    literal: TranslationKey;
    class: "styleError" | "styleStatus" | "styleQuestion";
}>;

export const messagesinfo = {
    status: {
        icon: Info,
        literal: "info.status",
        class: "styleStatus",
    },
    error: {
        icon: CircleX,
        literal: "info.error",
        class: "styleError",
    },
    question: {
        icon: CircleQuestionMark,
        literal: "info.question",
        class: "styleQuestion",
    },
} as const satisfies Readonly<Record<string, MessageInfo>>;

export type MessageInfoKind = keyof typeof messagesinfo;
