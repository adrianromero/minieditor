/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { hasTranslationKey, type Translator } from "./Localization";

type AppErrorPayload = {
    code: string;
    path?: string;
};

function parsePayload(error: unknown): AppErrorPayload | null {
    let candidate: unknown = error;

    if (typeof candidate === "string") {
        try {
            candidate = JSON.parse(candidate) as unknown;
        } catch {
            return null;
        }
    }

    if (typeof candidate !== "object" || candidate === null) {
        return null;
    }

    const payload = candidate as Record<string, unknown>;
    if (
        typeof payload.code !== "string" ||
        (payload.path !== undefined && typeof payload.path !== "string")
    ) {
        return null;
    }

    return {
        code: payload.code,
        ...(typeof payload.path === "string" ? { path: payload.path } : {}),
    };
}

export function translateAppError(error: unknown, t: Translator): string {
    const payload = parsePayload(error);
    if (!payload) {
        return t("errors.unknown");
    }

    const path = payload.path ?? t("toolbar.basePath");
    const translationKey = `backendErrors.${payload.code}`;
    if (!hasTranslationKey(translationKey)) {
        return t("errors.unknown");
    }
    return t(translationKey, { path });
}
