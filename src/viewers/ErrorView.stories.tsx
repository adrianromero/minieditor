import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { ErrorView } from "./ErrorView";

const meta = {
    title: "Components/ErrorView",
    component: ErrorView,
    tags: ["autodocs"],
    argTypes: {
        info: {
            control: "select",
            options: ["question", "status", "error"],
        },
    },
    args: {
        children: "Mensaje de ejemplo",
    },
} satisfies Meta<typeof ErrorView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Question: Story = {
    args: {
        info: "question",
        children: "Se necesita una decisión para continuar.",
    },
};

export const Status: Story = {
    args: {
        info: "status",
        children: "No hay contenido disponible para esta selección.",
    },
};

export const Error: Story = {
    args: {
        info: "error",
        children: "No se ha podido cargar el archivo.",
    },
};
