import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { SpinnerPanel } from "./SpinnerPanel";

const meta = {
    title: "Components/SpinnerPanel",
    component: SpinnerPanel,
    tags: ["autodocs"],
    parameters: {
        layout: "fullscreen",
    },
    args: {
        visible: true,
        text: "Cargando archivo…",
    },
} satisfies Meta<typeof SpinnerPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Visible: Story = {};

export const Hidden: Story = {
    args: {
        visible: false,
    },
};

export const LongMessage: Story = {
    args: {
        text: "Procesando el documento y preparando todos sus recursos vinculados…",
    },
};
