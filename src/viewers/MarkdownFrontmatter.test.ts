/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from "vitest";
import { joinMarkdownFrontmatter, splitMarkdownFrontmatter } from "./MarkdownFrontmatter";

describe("MarkdownFrontmatter", () => {
    it("deja intacto un documento sin frontmatter", () => {
        expect(splitMarkdownFrontmatter("# Título\n\nTexto")).toEqual({
            frontmatter: "",
            markdown: "# Título\n\nTexto",
            hasFrontmatter: false,
        });
    });

    it("separa una cabecera YAML delimitada con guiones", () => {
        expect(splitMarkdownFrontmatter("---\ntitle: Demo\ntags:\n  - test\n---\n# Título")).toEqual({
            frontmatter: "title: Demo\ntags:\n  - test",
            markdown: "# Título",
            hasFrontmatter: true,
        });
    });

    it("acepta puntos como delimitador de cierre y saltos CRLF", () => {
        expect(splitMarkdownFrontmatter("---\r\ntitle: Demo\r\n...\r\nTexto")).toEqual({
            frontmatter: "title: Demo",
            markdown: "Texto",
            hasFrontmatter: true,
        });
    });

    it("no separa una cabecera sin delimitador de cierre", () => {
        const content = "---\ntitle: Demo\n# Título";
        expect(splitMarkdownFrontmatter(content)).toEqual({
            frontmatter: "",
            markdown: content,
            hasFrontmatter: false,
        });
    });

    it("concatena el YAML no vacío como cabecera", () => {
        expect(joinMarkdownFrontmatter("title: Demo", "# Título")).toBe(
            "---\ntitle: Demo\n---\n# Título"
        );
    });

    it("omite la cabecera cuando el YAML solo contiene espacios", () => {
        expect(joinMarkdownFrontmatter(" \n\t", "# Título")).toBe("# Título");
    });
});
