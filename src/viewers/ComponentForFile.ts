/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import type { LanguageSupport } from "@codemirror/language";
import type { Component } from "solid-js";
import { editorTextExtensionsForFilename } from "./CodeLanguages";
import EditorText from "./EditorText";
import EditorMarkdown from "./EditorMarkdown";
import EditorExternalFile from "./EditorExternalFile";
import EditorImage from "./EditorImage";

type FileEditorProps = {
    extensions?: readonly LanguageSupport[];
};

type FileEditorSelection = FileEditorProps & {
    component: Component<FileEditorProps>;
};

export function componentForFilename(filename: string): FileEditorSelection {
    const normalizedFilename = filename.toLowerCase();
    const extensionIndex = normalizedFilename.lastIndexOf(".");
    const extension = extensionIndex >= 0 ? normalizedFilename.slice(extensionIndex) : "";

    switch (extension) {
        case ".md":
        case ".markdown":
        case ".mdown":
        case ".mkd":
            return { component: EditorMarkdown };
        case ".avif":
        case ".bmp":
        case ".gif":
        case ".ico":
        case ".jpeg":
        case ".jpg":
        case ".png":
        case ".webp":
            return { component: EditorImage };
    }

    const editorTextExtensions = editorTextExtensionsForFilename(normalizedFilename);
    if (editorTextExtensions) {
        return { component: EditorText, extensions: editorTextExtensions };
    }

    return { component: EditorExternalFile };
}
