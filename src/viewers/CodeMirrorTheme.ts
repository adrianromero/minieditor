/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { syntaxHighlighting } from "@codemirror/language";
import { classHighlighter } from "@lezer/highlight";

/** Stable token classes let CSS variables update highlighting without rebuilding an editor. */
export const codeMirrorSyntaxTheme = syntaxHighlighting(classHighlighter);
