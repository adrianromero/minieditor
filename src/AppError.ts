/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import type { Translator } from "./Localization";

const errorCodes = [
    "invalid_path",
    "path_not_found",
    "permission_denied",
    "inspect_path_failed",
    "read_directory_failed",
    "read_file_failed",
    "write_file_failed",
] as const;

type AppErrorCode = (typeof errorCodes)[number];

type AppErrorPayload = {
    code: AppErrorCode;
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
        !errorCodes.includes(payload.code as AppErrorCode) ||
        (payload.path !== undefined && typeof payload.path !== "string")
    ) {
        return null;
    }

    return {
        code: payload.code as AppErrorCode,
        ...(typeof payload.path === "string" ? { path: payload.path } : {}),
    };
}

export function translateAppError(error: unknown, t: Translator): string {
    const payload = parsePayload(error);
    if (!payload) {
        return t("errors.unknown");
    }

    const path = payload.path ?? t("toolbar.basePath");
    switch (payload.code) {
        case "invalid_path":
            return t("errors.invalidPath", { path });
        case "path_not_found":
            return t("errors.pathNotFound", { path });
        case "permission_denied":
            return t("errors.permissionDenied", { path });
        case "inspect_path_failed":
            return t("errors.inspectPathFailed", { path });
        case "read_directory_failed":
            return t("errors.readDirectoryFailed", { path });
        case "read_file_failed":
            return t("errors.readFileFailed", { path });
        case "write_file_failed":
            return t("errors.writeFileFailed", { path });
    }
}
