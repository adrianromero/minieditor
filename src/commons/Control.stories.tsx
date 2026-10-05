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
