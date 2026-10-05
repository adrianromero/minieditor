import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { Toolbar } from "./Toolbar";
import { StoryAppProvider } from "./stories/StoryAppProvider";

type ToolbarStoryArgs = {
    modified: boolean;
    reloadAvailable: boolean;
};

const meta = {
    title: "Application/Toolbar",
    args: {
        modified: false,
        reloadAvailable: true,
    },
    argTypes: {
        modified: { control: "boolean" },
        reloadAvailable: { control: "boolean" },
    },
    render: (args) => (
        <StoryAppProvider
            basepath="/home/adrian/documents"
            filename="projects/minieditor/README.md"
            modified={args.modified}
            reloadAvailable={args.reloadAvailable}
        >
            <div class="catalogToolbarStage">
                <Toolbar />
            </div>
        </StoryAppProvider>
    ),
} satisfies Meta<ToolbarStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Clean: Story = {};

export const Modified: Story = {
    args: {
        modified: true,
    },
};

export const NavigationOnly: Story = {
    args: {
        reloadAvailable: false,
    },
};
