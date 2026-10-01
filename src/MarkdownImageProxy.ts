/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { invoke } from "@tauri-apps/api/core";

type LocalImageSource = {
    href: string;
    fragment: string;
};

const uriSchemePattern = /^[A-Za-z][A-Za-z\d+.-]*:/;

export function localImageSource(source: string): LocalImageSource | null {
    if (
        source.length === 0 ||
        source.startsWith("#") ||
        source.startsWith("/") ||
        source.startsWith("\\") ||
        source.startsWith("//") ||
        uriSchemePattern.test(source)
    ) {
        return null;
    }

    const queryIndex = source.indexOf("?");
    const fragmentIndex = source.indexOf("#");
    const suffixIndexes = [queryIndex, fragmentIndex].filter((index) => index >= 0);
    const pathEnd = suffixIndexes.length > 0 ? Math.min(...suffixIndexes) : source.length;
    const encodedPath = source.slice(0, pathEnd);
    if (!encodedPath) {
        return null;
    }

    let href: string;
    try {
        href = decodeURIComponent(encodedPath);
    } catch {
        href = encodedPath;
    }

    return {
        href,
        fragment: fragmentIndex >= 0 ? source.slice(fragmentIndex) : "",
    };
}

export function imageMimeType(source: string): string {
    const extension = source.split(".").pop()?.toLowerCase();
    switch (extension) {
        case "avif":
            return "image/avif";
        case "bmp":
            return "image/bmp";
        case "gif":
            return "image/gif";
        case "ico":
            return "image/x-icon";
        case "jpeg":
        case "jpg":
            return "image/jpeg";
        case "png":
            return "image/png";
        case "svg":
            return "image/svg+xml";
        case "webp":
            return "image/webp";
        default:
            return "application/octet-stream";
    }
}

export type MarkdownImageProxy = {
    proxyDomURL: (source: string) => Promise<string> | string;
    dispose: () => void;
};

export function createMarkdownImageProxy(
    basepath: string,
    markdownFilename: string
): MarkdownImageProxy {
    const cachedUrls = new Map<string, Promise<string>>();
    const objectUrls = new Set<string>();
    let disposed = false;

    const proxyDomURL = (source: string): Promise<string> | string => {
        const localSource = localImageSource(source);
        if (!localSource) {
            return source;
        }

        const cached = cachedUrls.get(source);
        if (cached) {
            return cached;
        }

        const pendingUrl = invoke<number[]>("read_linked_binary_file", {
            basepath,
            filename: markdownFilename,
            href: localSource.href,
        })
            .then((content) => {
                const objectUrl = URL.createObjectURL(
                    new Blob([new Uint8Array(content)], {
                        type: imageMimeType(localSource.href),
                    })
                );
                if (disposed) {
                    URL.revokeObjectURL(objectUrl);
                } else {
                    objectUrls.add(objectUrl);
                }
                return `${objectUrl}${localSource.fragment}`;
            })
            .catch((error: unknown) => {
                cachedUrls.delete(source);
                throw error;
            });

        cachedUrls.set(source, pendingUrl);
        return pendingUrl;
    };

    return {
        proxyDomURL,
        dispose: () => {
            disposed = true;
            objectUrls.forEach((url) => URL.revokeObjectURL(url));
            objectUrls.clear();
            cachedUrls.clear();
        },
    };
}
