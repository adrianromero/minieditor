import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { createSignal, type JSX } from "solid-js";
import CircleDot from "lucide-solid/icons/circle-dot";
import Maximize2 from "lucide-solid/icons/maximize-2";
import RotateCcw from "lucide-solid/icons/rotate-ccw";
import RotateCw from "lucide-solid/icons/rotate-cw";
import ZoomIn from "lucide-solid/icons/zoom-in";
import ZoomOut from "lucide-solid/icons/zoom-out";
import { Control } from "./Control";
import { Sidebar } from "./Sidebar";

const meta = {
    title: "Layout/Sidebar",
    parameters: {
        layout: "padded",
    },
} satisfies Meta;

export default meta;
type Story = StoryObj;

function SidebarContent(props: { disabled?: boolean }): JSX.Element {
    const [zoom, setZoom] = createSignal(100);
    const [rotation, setRotation] = createSignal(0);

    return (
        <div class="sidebarPanel">
            <Control label="Nivel de zoom" value={`${zoom()}%`}>
                <input
                    type="range"
                    min="10"
                    max="500"
                    value={zoom()}
                    disabled={props.disabled}
                    onInput={(event) => setZoom(event.currentTarget.valueAsNumber)}
                />
            </Control>
            <div class="sidebarButtonGrid sidebarButtonGrid--5">
                <button
                    class="stdButton toolbar"
                    type="button"
                    title="Alejar"
                    disabled={props.disabled}
                    onClick={() => setZoom((value) => Math.max(10, value - 10))}
                >
                    <ZoomOut aria-hidden="true" />
                </button>
                <button
                    class="stdButton toolbar"
                    type="button"
                    title="Ajustar"
                    disabled={props.disabled}
                    onClick={() => setZoom(80)}
                >
                    <Maximize2 aria-hidden="true" />
                </button>
                <button
                    class="stdButton toolbar"
                    type="button"
                    title="Centrar"
                    disabled={props.disabled}
                >
                    <CircleDot aria-hidden="true" />
                </button>
                <button
                    class="stdButton toolbar"
                    type="button"
                    title="Tamaño real"
                    disabled={props.disabled}
                    onClick={() => setZoom(100)}
                >
                    1:1
                </button>
                <button
                    class="stdButton toolbar"
                    type="button"
                    title="Acercar"
                    disabled={props.disabled}
                    onClick={() => setZoom((value) => Math.min(500, value + 10))}
                >
                    <ZoomIn aria-hidden="true" />
                </button>
            </div>

            <Control label="Ángulo" value={`${rotation()}°`}>
                <input
                    type="range"
                    min="-180"
                    max="180"
                    value={rotation()}
                    disabled={props.disabled}
                    onInput={(event) => setRotation(event.currentTarget.valueAsNumber)}
                />
            </Control>
            <div class="sidebarButtonGrid sidebarButtonGrid--2">
                <button
                    class="stdButton toolbar"
                    type="button"
                    disabled={props.disabled}
                    onClick={() => setRotation((value) => value - 90)}
                >
                    <RotateCcw aria-hidden="true" />
                    -90° Izquierda
                </button>
                <button
                    class="stdButton toolbar"
                    type="button"
                    disabled={props.disabled}
                    onClick={() => setRotation((value) => value + 90)}
                >
                    <RotateCw aria-hidden="true" />
                    +90° Derecha
                </button>
            </div>

            <section class="sidebarSection">
                <h2 class="sidebarSectionTitle">Acciones</h2>
                <div class="sidebarButtonGrid sidebarButtonGrid--1">
                    <button
                        class="stdButton toolbar"
                        type="button"
                        disabled={props.disabled}
                        onClick={() => {
                            setZoom(100);
                            setRotation(0);
                        }}
                    >
                        Restablecer transformaciones
                    </button>
                </div>
            </section>
        </div>
    );
}

export const Enabled: Story = {
    render: () => (
        <div class="catalogSidebarStage">
            <Sidebar>
                <SidebarContent />
            </Sidebar>
        </div>
    ),
};

export const Disabled: Story = {
    render: () => (
        <div class="catalogSidebarStage">
            <Sidebar disabled>
                <SidebarContent disabled />
            </Sidebar>
        </div>
    ),
};
