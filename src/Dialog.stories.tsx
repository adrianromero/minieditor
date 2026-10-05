import { fn } from "storybook/test";
import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { Dialog } from "./Dialog";

const meta = {
    title: "Components/Dialog",
    component: Dialog,
    tags: ["autodocs"],
    parameters: {
        layout: "fullscreen",
    },
    argTypes: {
        info: {
            control: "select",
            options: ["question", "status", "error"],
        },
    },
    args: {
        open: true,
        message: "Mensaje del diálogo",
        onCancel: fn(),
        onConfirm: fn(),
        onClose: fn(),
    },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Question: Story = {
    name: "question",
    args: {
        info: "question",
        message: "¿Quieres continuar con esta operación?",
        confirmLabel: "Continuar",
        cancelLabel: "Cancelar",
    },
};

export const Status: Story = {
    name: "status",
    args: {
        info: "status",
        message: "La operación ha finalizado correctamente.",
        cancelLabel: "Cerrar",
    },
};

export const Error: Story = {
    name: "error",
    args: {
        info: "error",
        message: "No se ha podido completar la operación.",
        cancelLabel: "Cerrar",
    },
};
