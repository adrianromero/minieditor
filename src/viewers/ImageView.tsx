/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { createSignal, For, Show, type JSX } from "solid-js";
import {
    binaryFileStorage,
    createFileEditorController,
    type FileEditorAdapter,
} from "../FileEditorController";
import { useI18N } from "../Localization";

import { UserMessageError } from "../UserMessageError";
import ErrorView from "./ErrorView";
import styles from "./ImageView.module.css";
import {
    CircleDot,
    Grid3x3,
    Maximize2,
    RotateCcw,
    RotateCw,
    SquareCenterlineDashedHorizontal,
    SquareCenterlineDashedVertical,
    ZoomIn,
    ZoomOut,
} from "lucide-solid";

type Tab = "transform" | "adjust" | "presets";
type FilterName = "brightness" | "contrast" | "saturation" | "grayscale" | "sepia" | "invert";
type PresetName = "normal" | "monochrome" | "vintage" | "vivid" | "dramatic" | "negative";
type ImageSettings = Record<FilterName, number> & {
    rotation: number;
    flipHorizontal: boolean;
    flipVertical: boolean;
};
type FilterDefinition = { name: FilterName; min: number; max: number; unit: string };

const defaultSettings: ImageSettings = {
    rotation: 0,
    flipHorizontal: false,
    flipVertical: false,
    brightness: 100,
    contrast: 100,
    saturation: 100,
    grayscale: 0,
    sepia: 0,
    invert: 0,
};
const filters: readonly FilterDefinition[] = [
    { name: "brightness", min: 0, max: 200, unit: "%" },
    { name: "contrast", min: 0, max: 200, unit: "%" },
    { name: "saturation", min: 0, max: 200, unit: "%" },
    { name: "grayscale", min: 0, max: 100, unit: "%" },
    { name: "sepia", min: 0, max: 100, unit: "%" },
    { name: "invert", min: 0, max: 100, unit: "%" },
];
const presetNames = ["normal", "monochrome", "vintage", "vivid", "dramatic", "negative"] as const;
const presets: Readonly<Record<PresetName, Partial<ImageSettings>>> = {
    normal: {},
    monochrome: { grayscale: 100, contrast: 120 },
    vintage: { sepia: 70, brightness: 90, contrast: 90 },
    vivid: { saturation: 160, contrast: 110 },
    dramatic: { contrast: 150, brightness: 85, saturation: 80 },
    negative: { invert: 100 },
};
const writableMimeTypes: Readonly<Record<string, string>> = {
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
};

const extensionOf = (name: string): string => name.split(".").pop()?.toLowerCase() ?? "";
const normalizeRotation = (angle: number): number => {
    let normalized = ((angle % 360) + 360) % 360;
    if (normalized > 180) normalized -= 360;
    if (normalized === 180 && angle < 0) return -180;
    return normalized;
};
const clampChannel = (value: number): number => Math.min(255, Math.max(0, value));

function applyAdjustments(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    settings: ImageSettings
): void {
    const imageData = context.getImageData(0, 0, width, height);
    const data = imageData.data;
    const brightness = settings.brightness / 100;
    const contrast = settings.contrast / 100;
    const saturation = settings.saturation / 100;
    const grayscale = settings.grayscale / 100;
    const sepia = settings.sepia / 100;
    const invert = settings.invert / 100;

    for (let index = 0; index < data.length; index += 4) {
        if (data[index + 3] === 0) continue;
        let red = (data[index] * brightness - 128) * contrast + 128;
        let green = (data[index + 1] * brightness - 128) * contrast + 128;
        let blue = (data[index + 2] * brightness - 128) * contrast + 128;

        let luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
        red = luminance + (red - luminance) * saturation;
        green = luminance + (green - luminance) * saturation;
        blue = luminance + (blue - luminance) * saturation;

        luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
        red += (luminance - red) * grayscale;
        green += (luminance - green) * grayscale;
        blue += (luminance - blue) * grayscale;

        const sepiaRed = red * 0.393 + green * 0.769 + blue * 0.189;
        const sepiaGreen = red * 0.349 + green * 0.686 + blue * 0.168;
        const sepiaBlue = red * 0.272 + green * 0.534 + blue * 0.131;
        red += (sepiaRed - red) * sepia;
        green += (sepiaGreen - green) * sepia;
        blue += (sepiaBlue - blue) * sepia;

        data[index] = clampChannel(red + (255 - red * 2) * invert);
        data[index + 1] = clampChannel(green + (255 - green * 2) * invert);
        data[index + 2] = clampChannel(blue + (255 - blue * 2) * invert);
    }

    context.putImageData(imageData, 0, 0);
}

function canvasToBytes(canvas: HTMLCanvasElement, mimeType: string): Promise<number[]> {
    return new Promise((resolve, reject) =>
        canvas.toBlob(
            (blob) => {
                if (!blob || blob.type !== mimeType) {
                    reject(new Error(`The WebView cannot encode ${mimeType}.`));
                    return;
                }
                void blob
                    .arrayBuffer()
                    .then((buffer) => resolve(Array.from(new Uint8Array(buffer))), reject);
            },
            mimeType,
            0.92
        )
    );
}

export function ImageView(): JSX.Element {
    let viewportRef!: HTMLDivElement;
    let canvasRef!: HTMLCanvasElement;
    let sourceImage: HTMLImageElement | null = null;
    let sourceUrl: string | null = null;
    let dragging = false;
    let dragOriginX = 0;
    let dragOriginY = 0;
    let currentFilename = "";
    let markModified = (): void => undefined;

    const { t } = useI18N();
    const [activeTab, setActiveTab] = createSignal<Tab>("transform");
    const [settings, setSettings] = createSignal<ImageSettings>({ ...defaultSettings });
    const [zoom, setZoom] = createSignal(1);
    const [panX, setPanX] = createSignal(0);
    const [panY, setPanY] = createSignal(0);
    const [showGrid, setShowGrid] = createSignal(false);
    const [dimensions, setDimensions] = createSignal({ width: 0, height: 0 });

    const renderCanvas = (): void => {
        if (!sourceImage) return;
        const current = settings();
        const radians = (current.rotation * Math.PI) / 180;
        const sine = Math.abs(Math.sin(radians));
        const cosine = Math.abs(Math.cos(radians));
        const width = Math.max(
            1,
            Math.ceil(sourceImage.naturalWidth * cosine + sourceImage.naturalHeight * sine)
        );
        const height = Math.max(
            1,
            Math.ceil(sourceImage.naturalWidth * sine + sourceImage.naturalHeight * cosine)
        );
        const context = canvasRef.getContext("2d");
        if (!context) return;
        canvasRef.width = width;
        canvasRef.height = height;
        context.clearRect(0, 0, width, height);
        context.save();
        context.translate(width / 2, height / 2);
        context.rotate(radians);
        context.scale(current.flipHorizontal ? -1 : 1, current.flipVertical ? -1 : 1);
        context.drawImage(
            sourceImage,
            -sourceImage.naturalWidth / 2,
            -sourceImage.naturalHeight / 2
        );
        context.restore();
        applyAdjustments(context, width, height, current);
        setDimensions({ width, height });
    };

    const fitImage = (): void => {
        if (!viewportRef || !canvasRef.width || !canvasRef.height) return;
        setZoom(
            Math.min(
                Math.max(1, viewportRef.clientWidth - 64) / canvasRef.width,
                Math.max(1, viewportRef.clientHeight - 64) / canvasRef.height,
                1
            )
        );
        setPanX(0);
        setPanY(0);
    };
    const updateSettings = (change: Partial<ImageSettings>, modified = true): void => {
        setSettings((current) => ({ ...current, ...change }));
        queueMicrotask(renderCanvas);
        if (modified) markModified();
    };
    const resetFilters = (modified = true): void =>
        updateSettings(
            {
                brightness: 100,
                contrast: 100,
                saturation: 100,
                grayscale: 0,
                sepia: 0,
                invert: 0,
            },
            modified
        );

    const destroyImage = (): void => {
        sourceImage = null;
        if (sourceUrl) URL.revokeObjectURL(sourceUrl);
        sourceUrl = null;
        canvasRef?.getContext("2d")?.clearRect(0, 0, canvasRef.width, canvasRef.height);
        setDimensions({ width: 0, height: 0 });
    };

    const adapter: FileEditorAdapter<number[]> = {
        getContent: async () => {
            if (!sourceImage) return null;
            const mimeType = writableMimeTypes[extensionOf(currentFilename)];
            if (!mimeType) throw new UserMessageError(t("image.unsupportedSaveFormat"));
            return canvasToBytes(canvasRef, mimeType);
        },
        replaceContent: async (content, filename, onModified) => {
            destroyImage();
            currentFilename = filename;
            markModified = onModified;
            sourceUrl = URL.createObjectURL(new Blob([new Uint8Array(content)]));
            const image = new Image();
            await new Promise<void>((resolve, reject) => {
                image.onload = () => resolve();
                image.onerror = () => reject(new Error("Unable to decode image."));
                image.src = sourceUrl ?? "";
            });
            sourceImage = image;
            setSettings({ ...defaultSettings });
            renderCanvas();
            fitImage();
        },
        destroy: () => {
            destroyImage();
            currentFilename = "";
            markModified = (): void => undefined;
        },
    };

    const { error } = createFileEditorController("ImageView", adapter, binaryFileStorage);
    const applyPreset = (name: PresetName): void => {
        setSettings({ ...defaultSettings, ...presets[name] });
        queueMicrotask(renderCanvas);
        markModified();
    };
    const rotateBy = (degrees: number): void => {
        updateSettings({ rotation: normalizeRotation(settings().rotation + degrees) });
    };
    const handlePointerDown = (event: PointerEvent): void => {
        if (event.target instanceof Element && event.target.closest("button")) return;
        dragging = true;
        dragOriginX = event.clientX - panX();
        dragOriginY = event.clientY - panY();
        viewportRef.setPointerCapture(event.pointerId);
    };
    const handlePointerMove = (event: PointerEvent): void => {
        if (dragging) {
            setPanX(event.clientX - dragOriginX);
            setPanY(event.clientY - dragOriginY);
        }
    };
    const handlePointerUp = (event: PointerEvent): void => {
        dragging = false;
        if (viewportRef.hasPointerCapture(event.pointerId))
            viewportRef.releasePointerCapture(event.pointerId);
    };

    return (
        <Show when={!error()} fallback={<ErrorView>{error() ?? t("errors.unknown")}</ErrorView>}>
            <section class={styles.studio}>
                <div
                    ref={viewportRef}
                    class={`${styles.viewport} ${showGrid() ? styles.grid : ""}`}
                    onWheel={(event) => {
                        event.preventDefault();
                        setZoom((value) =>
                            Math.min(5, Math.max(0.1, value * (event.deltaY < 0 ? 1.1 : 0.9)))
                        );
                    }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                >
                    <canvas
                        ref={canvasRef}
                        class={styles.canvas}
                        style={{
                            transform: `translate(-50%, -50%) translate(${panX()}px, ${panY()}px) scale(${zoom()})`,
                        }}
                    />
                    <div class={styles.hud}>
                        <span>
                            {dimensions().width} × {dimensions().height} px
                        </span>
                        <span>•</span>
                        <span>{Math.round(zoom() * 100)}%</span>
                        <span>•</span>
                        <span>{settings().rotation}°</span>
                    </div>
                </div>
                <aside class={styles.sidebar}>
                    <div class="tabs">
                        <For each={["transform", "adjust", "presets"] as const}>
                            {(tab) => (
                                <button
                                    class={`stdButton tab ${activeTab() === tab ? "activeTab" : ""}`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {t(`image.${tab}`)}
                                </button>
                            )}
                        </For>
                    </div>
                    <div class={styles.panel}>
                        <Show when={activeTab() === "transform"}>
                            <Control label={t("image.zoom")} value={`${Math.round(zoom() * 100)}%`}>
                                <input
                                    type="range"
                                    min="10"
                                    max="500"
                                    value={Math.round(zoom() * 100)}
                                    onInput={(event) =>
                                        setZoom(event.currentTarget.valueAsNumber / 100)
                                    }
                                />
                            </Control>

                            <div class={styles.zoomGrid}>
                                <button
                                    class="stdButton toolbar"
                                    title={t("image.zoomOut")}
                                    onClick={() => setZoom((value) => Math.max(0.1, value / 1.2))}
                                >
                                    <ZoomOut aria-hidden="true" />
                                </button>
                                <button
                                    class="stdButton toolbar"
                                    title={t("image.fit")}
                                    onClick={fitImage}
                                >
                                    <Maximize2 aria-hidden="true" />
                                </button>
                                <button
                                    class="stdButton toolbar"
                                    title={t("image.center")}
                                    onClick={() => {
                                        setPanX(0);
                                        setPanY(0);
                                    }}
                                >
                                    <CircleDot aria-hidden="true" />
                                </button>
                                <button
                                    class="stdButton toolbar"
                                    title={t("image.actualSize")}
                                    onClick={() => setZoom(1)}
                                >
                                    1:1
                                </button>
                                <button
                                    class="stdButton toolbar"
                                    title={t("image.zoomIn")}
                                    onClick={() => setZoom((value) => Math.min(5, value * 1.2))}
                                >
                                    <ZoomIn aria-hidden="true" />
                                </button>
                            </div>

                            <Control label={t("image.rotation")} value={`${settings().rotation}°`}>
                                <input
                                    type="range"
                                    min="-180"
                                    max="180"
                                    value={settings().rotation}
                                    onInput={(event) =>
                                        updateSettings({
                                            rotation: event.currentTarget.valueAsNumber,
                                        })
                                    }
                                />
                            </Control>
                            <div class={styles.buttonGrid}>
                                <button class="stdButton toolbar" onClick={() => rotateBy(-90)}>
                                    <RotateCcw aria-hidden="true" />
                                    {t("image.rotateLeft")}
                                </button>
                                <button class="stdButton toolbar" onClick={() => rotateBy(90)}>
                                    <RotateCw aria-hidden="true" />
                                    {t("image.rotateRight")}
                                </button>
                            </div>
                            <div>
                                <label class="controlLabel">
                                    <div>{t("image.flipMirror")}</div>
                                </label>
                                <div class={styles.buttonGrid}>
                                    <button
                                        class="stdButton toolbar"
                                        onClick={() =>
                                            updateSettings({
                                                flipHorizontal: !settings().flipHorizontal,
                                            })
                                        }
                                    >
                                        <SquareCenterlineDashedVertical aria-hidden="true" />
                                        {t("image.horizontal")}
                                    </button>
                                    <button
                                        class="stdButton toolbar"
                                        onClick={() =>
                                            updateSettings({
                                                flipVertical: !settings().flipVertical,
                                            })
                                        }
                                    >
                                        <SquareCenterlineDashedHorizontal aria-hidden="true" />
                                        {t("image.vertical")}
                                    </button>
                                </div>
                            </div>

                            <button
                                class={`stdButton toolbar ${showGrid() ? styles.activeButton : ""}`}
                                style={{ "grid-column": "span 5" }}
                                onClick={() => setShowGrid((value) => !value)}
                            >
                                <Grid3x3 aria-hidden="true" />
                                {t("image.grid")}
                            </button>
                            <button
                                class="stdButton toolbar"
                                onClick={() => {
                                    updateSettings({
                                        flipHorizontal: false,
                                        flipVertical: false,
                                        rotation: 0,
                                    });
                                    queueMicrotask(fitImage);
                                }}
                            >
                                {t("image.resetTransform")}
                            </button>
                        </Show>
                        <Show when={activeTab() === "adjust"}>
                            <For each={filters}>
                                {(filter) => (
                                    <Control
                                        label={t(`image.${filter.name}`)}
                                        value={`${settings()[filter.name]}${filter.unit}`}
                                    >
                                        <input
                                            type="range"
                                            min={filter.min}
                                            max={filter.max}
                                            value={settings()[filter.name]}
                                            onInput={(event) =>
                                                updateSettings({
                                                    [filter.name]:
                                                        event.currentTarget.valueAsNumber,
                                                })
                                            }
                                        />
                                    </Control>
                                )}
                            </For>
                            <button class="stdButton toolbar" onClick={() => resetFilters()}>
                                {t("image.resetFilters")}
                            </button>
                        </Show>
                        <Show when={activeTab() === "presets"}>
                            <div class={styles.presetGrid}>
                                <For each={presetNames}>
                                    {(preset) => (
                                        <button
                                            class="stdButton toolbar"
                                            onClick={() => applyPreset(preset)}
                                        >
                                            {t(`image.preset.${preset}`)}
                                        </button>
                                    )}
                                </For>
                            </div>
                        </Show>
                    </div>
                </aside>
            </section>
        </Show>
    );
}

function Control(props: { label: string; value: string; children: JSX.Element }): JSX.Element {
    return (
        <label class={styles.control}>
            <span>
                <strong>{props.label}</strong>
                <output>{props.value}</output>
            </span>
            {props.children}
        </label>
    );
}

export default ImageView;
