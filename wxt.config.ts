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
		name: "Moke",
		permissions: ["storage", "tabs"],
		icons: {
			16: "16.png",
			32: "32.png",
			48: "48.png",
			96: "96.png",
			128: "128.png"
		},
		action: {
			default_icon: {
				16: "16.png",
				32: "32.png",
				48: "48.png",
				96: "96.png",
				128: "128.png"
			}
		},
		options_ui: {
			page: "entrypoints/options/index.html",
			open_in_tab: true
		},
	},
});
