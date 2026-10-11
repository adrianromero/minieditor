import addonA11y from "@storybook/addon-a11y";
import addonDocs from "@storybook/addon-docs";
import { UPDATE_GLOBALS } from "storybook/internal/core-events";
import { getChannel, useGlobals } from "storybook/preview-api";
import { createJSXDecorator, definePreview } from "storybook-solidjs-vite";
import I18NProvider from "../src/Localization";
import { applyTheme, type AppTheme } from "../src/ThemePreferences";
import "../src/theme.css";
import "./storybook.css";

type UpdateGlobalsPayload = {
    globals: Record<string, unknown>;
};

let themeListenerRegistered = false;

function getTheme(value: unknown): AppTheme {
    return value === "dark" ? "dark" : "light";
}

function ensureThemeListener(): void {
    if (themeListenerRegistered) {
        return;
    }

    getChannel().on(UPDATE_GLOBALS, ({ globals }: UpdateGlobalsPayload) => {
        if ("theme" in globals) {
            applyTheme(getTheme(globals.theme));
        }
    });
    themeListenerRegistered = true;
}

const withThemeAndI18N = createJSXDecorator((Story) => {
    const [globals] = useGlobals();
    ensureThemeListener();
    applyTheme(getTheme(globals.theme));

    return (
        <I18NProvider>
            <Story />
        </I18NProvider>
    );
});

export default definePreview({
    addons: [addonDocs(), addonA11y()],
    decorators: [withThemeAndI18N],
    globalTypes: {
        theme: {
            description: "Application color theme",
            defaultValue: "light",
            toolbar: {
                icon: "circlehollow",
                items: [
                    { value: "light", icon: "sun", title: "Light" },
                    { value: "dark", icon: "moon", title: "Dark" },
                ],
                dynamicTitle: true,
            },
        },
    },
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
