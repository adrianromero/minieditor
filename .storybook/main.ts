import { defineMain } from "storybook-solidjs-vite";

export default defineMain({
    framework: {
        name: "storybook-solidjs-vite",
    },
    stories: ["../src/**/*.stories.@(ts|tsx)"],
});
