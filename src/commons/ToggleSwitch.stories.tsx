import { createEffect, createSignal, type JSX } from "solid-js";
import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { ToggleSwitch, type ToggleSwitchSize } from "./ToggleSwitch";

type ToggleSwitchStoryArgs = {
    label: string;
    checked: boolean;
    size: ToggleSwitchSize;
    disabled: boolean;
};

const meta = {
    title: "Components/ToggleSwitch",
    parameters: {
        layout: "padded",
    },
    args: {
        label: "Notificaciones activas",
        checked: false,
        size: "medium",
        disabled: false,
    },
    argTypes: {
        label: { control: "text" },
        checked: { control: "boolean" },
        size: {
            control: "select",
            options: ["small", "medium", "large"],
        },
        disabled: { control: "boolean" },
    },
    render: (args) => <InteractiveToggle {...args} />,
} satisfies Meta<ToggleSwitchStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

function InteractiveToggle(props: ToggleSwitchStoryArgs): JSX.Element {
    const [checked, setChecked] = createSignal(props.checked);

    createEffect(() => setChecked(props.checked));

    return (
        <ToggleSwitch
            label={props.label}
            checked={checked()}
            size={props.size}
            disabled={props.disabled}
            onChange={setChecked}
        />
    );
}

function Variant(props: ToggleSwitchStoryArgs): JSX.Element {
    return (
        <div
            style={{
                display: "flex",
                "min-height": "2.5rem",
                "align-items": "center",
            }}
        >
            <InteractiveToggle {...props} />
        </div>
    );
}

export const Playground: Story = {};

export const Sizes: Story = {
    render: () => (
        <div style={{ display: "flex", "flex-direction": "column", gap: "1rem" }}>
            <Variant label="Pequeño" checked={false} size="small" disabled={false} />
            <Variant label="Mediano" checked={false} size="medium" disabled={false} />
            <Variant label="Grande" checked={false} size="large" disabled={false} />
        </div>
    ),
};

export const States: Story = {
    render: () => (
        <div
            style={{
                display: "grid",
                "grid-template-columns": "repeat(2, minmax(12rem, max-content))",
                gap: "1rem 2rem",
            }}
        >
            <Variant label="Desactivado" checked={false} size="medium" disabled={false} />
            <Variant label="Activado" checked={true} size="medium" disabled={false} />
            <Variant
                label="Desactivado y deshabilitado"
                checked={false}
                size="medium"
                disabled={true}
            />
            <Variant
                label="Activado y deshabilitado"
                checked={true}
                size="medium"
                disabled={true}
            />
        </div>
    ),
};

export const AllVariants: Story = {
    render: () => (
        <div
            style={{
                display: "grid",
                "grid-template-columns": "repeat(2, minmax(12rem, max-content))",
                gap: "1rem 2rem",
            }}
        >
            {(["small", "medium", "large"] satisfies ToggleSwitchSize[]).flatMap((size) => [
                <Variant
                    label={`${size} desactivado`}
                    checked={false}
                    size={size}
                    disabled={false}
                />,
                <Variant
                    label={`${size} activado`}
                    checked={true}
                    size={size}
                    disabled={false}
                />,
                <Variant
                    label={`${size} deshabilitado`}
                    checked={false}
                    size={size}
                    disabled={true}
                />,
                <Variant
                    label={`${size} activado y deshabilitado`}
                    checked={true}
                    size={size}
                    disabled={true}
                />,
            ])}
        </div>
    ),
};
