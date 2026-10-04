/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { remarkStringifyOptionsCtx } from "@milkdown/kit/core";
import type { Ctx } from "@milkdown/kit/ctx";

export function configureMarkdownSerialization(ctx: Ctx): void {
    ctx.update(remarkStringifyOptionsCtx, (options) => ({
        ...options,
        bullet: "-" as const,
        rule: "-" as const,
        ruleRepetition: 3,
        ruleSpaces: false,
    }));
}
