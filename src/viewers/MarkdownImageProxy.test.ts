/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { invoke } from "@tauri-apps/api/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    createMarkdownImageProxy,
    imageMimeType,
    localImageSource,
} from "./MarkdownImageProxy";

vi.mock("@tauri-apps/api/core", () => ({
    invoke: vi.fn(),
}));

const invokeMock = vi.mocked(invoke);

beforeEach(() => {
    invokeMock.mockReset();
});

describe("localImageSource", () => {
    it("recognizes a relative image and decodes its filesystem path", () => {
        expect(localImageSource("../images/my%20photo.png#preview")).toEqual({
            href: "../images/my photo.png",
            fragment: "#preview",
        });
    });

    it("removes a cache query from the filesystem path", () => {
        expect(localImageSource("./image.png?v=2")).toEqual({
            href: "./image.png",
            fragment: "",
        });
    });

    it.each([
        "http://example.com/image.png",
        "https://example.com/image.png",
        "data:image/png;base64,AA==",
        "blob:http://localhost/id",
        "/image.png",
        "//example.com/image.png",
        "#symbol",
    ])("leaves non-relative source %s untouched", (source) => {
        expect(localImageSource(source)).toBeNull();
    });
});

describe("imageMimeType", () => {
    it("returns the MIME type for common image formats", () => {
        expect(imageMimeType("image.PNG")).toBe("image/png");
        expect(imageMimeType("photo.jpg")).toBe("image/jpeg");
        expect(imageMimeType("drawing.svg")).toBe("image/svg+xml");
    });

    it("uses a safe generic type for unknown extensions", () => {
        expect(imageMimeType("image.unknown")).toBe("application/octet-stream");
    });
});

describe("createMarkdownImageProxy", () => {
    it("keeps remote image URLs unchanged", () => {
        const proxy = createMarkdownImageProxy("/documents", "/documents/note.md");

        expect(proxy.proxyDomURL("https://example.com/image.png")).toBe(
            "https://example.com/image.png"
        );
        expect(invokeMock).not.toHaveBeenCalled();
    });

    it("creates an object URL for an existing local image", async () => {
        invokeMock.mockResolvedValue([137, 80, 78, 71]);
        const createObjectURL = vi
            .spyOn(URL, "createObjectURL")
            .mockReturnValue("blob:http://localhost/image");
        const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
        const proxy = createMarkdownImageProxy("/documents", "/documents/note.md");

        await expect(proxy.proxyDomURL("./image.png")).resolves.toBe(
            "blob:http://localhost/image"
        );
        expect(createObjectURL).toHaveBeenCalledOnce();

        proxy.dispose();
        expect(revokeObjectURL).toHaveBeenCalledWith("blob:http://localhost/image");
    });

    it("returns a visible fallback when a local image does not exist", async () => {
        const readError = new Error("File not found");
        invokeMock.mockRejectedValue(readError);
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        const proxy = createMarkdownImageProxy("/documents", "/documents/note.md");

        const result = await proxy.proxyDomURL("./missing.png");

        expect(result).toMatch(/^data:image\/svg\+xml;charset=utf-8,/);
        expect(decodeURIComponent(result)).toContain('width="160" height="160"');
        expect(consoleError).toHaveBeenCalledWith(
            "Unable to load local Markdown image:",
            readError
        );
    });
});
