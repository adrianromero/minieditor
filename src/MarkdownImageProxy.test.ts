/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from "vitest";
import { imageMimeType, localImageSource } from "./MarkdownImageProxy";

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
