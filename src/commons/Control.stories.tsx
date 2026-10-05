import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { Control } from "./Control";

const meta = {
    title: "Components/Control",
    parameters: {
        layout: "padded",
    },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Range: Story = {
    render: () => (
        <div class="catalogColumn">
            <Control label="Zoom" value="100%">
                <input type="range" min="10" max="500" value="100" />
            </Control>
        </div>
    ),
};

export const Select: Story = {
    render: () => (
        <div class="catalogColumn">
            <Control label="Orientación" value="Horizontal">
                <select>
                    <option>Horizontal</option>
                    <option>Vertical</option>
                </select>
            </Control>
        </div>
    ),
};

export const Checkbox: Story = {
    render: () => (
        <div class="catalogColumn">
            <Control label="Vista previa" value="Activada">
                <input type="checkbox" checked />
            </Control>
        </div>
    ),
};
