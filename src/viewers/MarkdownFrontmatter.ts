/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

export type MarkdownFrontmatter = {
    frontmatter: string;
    markdown: string;
    hasFrontmatter: boolean;
};

const OPENING_DELIMITER = /^---[ \t]*(?:\r?\n|$)/;
const CLOSING_DELIMITER = /^(?:---|\.\.\.)[ \t]*(?:\r?\n|$)/m;

export function splitMarkdownFrontmatter(content: string): MarkdownFrontmatter {
    const opening = OPENING_DELIMITER.exec(content);
    if (!opening) {
        return { frontmatter: "", markdown: content, hasFrontmatter: false };
    }

    const bodyStart = opening[0].length;
    const contentAfterOpening = content.slice(bodyStart);
    const closing = CLOSING_DELIMITER.exec(contentAfterOpening);
    if (!closing || closing.index === undefined) {
        return { frontmatter: "", markdown: content, hasFrontmatter: false };
    }

    const frontmatterWithLineBreak = contentAfterOpening.slice(0, closing.index);
    const frontmatter = frontmatterWithLineBreak.replace(/\r?\n$/, "");
    const markdown = contentAfterOpening.slice(closing.index + closing[0].length);

    return { frontmatter, markdown, hasFrontmatter: true };
}

export function joinMarkdownFrontmatter(frontmatter: string, markdown: string): string {
    if (frontmatter.trim().length === 0) {
        return markdown;
    }

    const lineBreak = frontmatter.endsWith("\n") ? "" : "\n";
    return `---\n${frontmatter}${lineBreak}---\n${markdown}`;
}
