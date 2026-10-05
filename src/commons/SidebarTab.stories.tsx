import type { Meta, StoryObj } from "storybook-solidjs-vite";
import type { JSX } from "solid-js";
import { Sidebar } from "./Sidebar";
import { SidebarTab } from "./SidebarTab";
import { SidebarTabSection } from "./SidebarTabSection";

const meta = {
    title: "Layout/SidebarTab",
    parameters: {
        layout: "padded",
    },
} satisfies Meta;

export default meta;
type Story = StoryObj;

function TabbedSidebar(props: { disabled?: boolean }): JSX.Element {
    return (
        <div class="catalogSidebarStage">
            <Sidebar disabled={props.disabled}>
                <SidebarTab defaultKey="transform">
                    <SidebarTabSection key="transform" label="Transformar">
                        <p>Controles de tamaño, giro y orientación.</p>
                    </SidebarTabSection>
                    <SidebarTabSection key="adjust" label="Ajustar">
                        <p>Controles de brillo, contraste y color.</p>
                    </SidebarTabSection>
                </SidebarTab>
            </Sidebar>
        </div>
    );
}

export const Default: Story = {
    render: () => <TabbedSidebar />,
};

export const Disabled: Story = {
    render: () => <TabbedSidebar disabled />,
};
