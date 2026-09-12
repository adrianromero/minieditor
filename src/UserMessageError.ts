/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

/** An error whose message is safe to present directly to the user. */
export class UserMessageError extends Error {
    readonly cause: unknown;

    constructor(message: string, cause?: unknown) {
        super(message);
        this.name = "UserMessageError";
        this.cause = cause;
    }
}
