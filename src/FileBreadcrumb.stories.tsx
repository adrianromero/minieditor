import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { FileBreadcrumb } from "./FileBreadcrumb";
import { StoryAppProvider } from "./stories/StoryAppProvider";

type BreadcrumbStoryArgs = {
    basepath: string;
    filename: string;
};

const meta = {
    title: "Application/FileBreadcrumb",
    args: {
        basepath: "/home/adrian/documents",
        filename: "notes/today.md",
    },
    argTypes: {
        basepath: { control: "text" },
        filename: { control: "text" },
    },
    render: (args) => (
        <StoryAppProvider basepath={args.basepath} filename={args.filename}>
            <div class="catalogToolbarStage" style={{ padding: "0.75rem 1.5rem" }}>
                <FileBreadcrumb />
            </div>
        </StoryAppProvider>
    ),
} satisfies Meta<BreadcrumbStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BasePath: Story = {
    args: {
        filename: "",
    },
};

export const ShortPath: Story = {};

export const LongPath: Story = {
    args: {
        filename: "projects/minieditor/docs/guides/getting-started/configuration.md",
    },
};
