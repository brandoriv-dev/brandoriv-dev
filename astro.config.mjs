// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://brandoriv.dev",
  // /thanks is noindexed (form-redirect target), so keep it out of the sitemap.
  integrations: [sitemap({ filter: (page) => !page.includes("/thanks") })],
  vite: {
    plugins: [tailwindcss()],
  },
});
