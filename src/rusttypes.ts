/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

/** Types serialized by commands in the Rust backend. */

export type InitialConfig = {
    basepath: string;
    filename: string;
};

export type PathKind = "file" | "directory" | "other";

export type DirectoryEntry = {
    name: string;
    filename: string;
    kind: "directory" | "file";
};

export type ReadFileResult = {
    content: string;
    isNew: boolean;
};

export type ReadBinaryFileResult = {
    content: number[];
    isNew: boolean;
};
