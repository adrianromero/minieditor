import addonA11y from "@storybook/addon-a11y";
import addonDocs from "@storybook/addon-docs";
import { createJSXDecorator, definePreview } from "storybook-solidjs-vite";
import I18NProvider from "../src/Localization";
import "../src/theme.css";
import "./storybook.css";

document.documentElement.dataset.theme = "light";

const withI18N = createJSXDecorator((Story) => (
    <I18NProvider>
        <Story />
    </I18NProvider>
));

export default definePreview({
    addons: [addonDocs(), addonA11y()],
    decorators: [withI18N],
    parameters: {
        controls: {
            expanded: true,
        },
        options: {
            storySort: {
                order: ["Components", "Layout", "Application"],
            },
        },
    },
});
