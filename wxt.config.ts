import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
	srcDir: "src",
	modules: ["@wxt-dev/module-react"],
	vite: () => ({
		plugins: [tailwindcss()],
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "./src"),
			},
		},
	}),
	manifest: {
		name: "BookMarkHub",
		permissions: ["storage", "tabs"],
		options_ui: {
			page: "entrypoints/options/index.html",
			open_in_tab: true
		},
	},
});
