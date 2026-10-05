import type { Meta, StoryObj } from "storybook-solidjs-vite";
import type { JSX } from "solid-js";
import { Sidebar } from "./Sidebar";

const meta = {
    title: "Layout/Sidebar",
    parameters: {
        layout: "padded",
    },
} satisfies Meta;

export default meta;
type Story = StoryObj;

function SidebarContent(): JSX.Element {
    return (
        <div class="catalogColumn" style={{ padding: "1rem" }}>
            <h2 style={{ margin: 0, "font-size": "1rem" }}>Propiedades</h2>
            <label>
                Nombre
                <input type="text" value="Documento" />
            </label>
            <button class="stdButton" type="button">
                Aplicar
            </button>
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
                <SidebarContent />
            </Sidebar>
        </div>
    ),
};
