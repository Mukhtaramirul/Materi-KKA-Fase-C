import { HtmlBasePlugin } from "@11ty/eleventy";

export default function (eleventyConfig) {
  // Menyesuaikan semua link "/..." dengan alamat GitHub Pages (misal /materi-kka-fasec/).
  eleventyConfig.addPlugin(HtmlBasePlugin);
  eleventyConfig.addPassthroughCopy("src/assets");

  // Alamat web yang tertulis di materi otomatis menjadi link yang bisa diklik.
  eleventyConfig.amendLibrary("md", (md) => md.set({ linkify: true }));

  // Daftar bab, diurutkan sesuai nomor bab.
  eleventyConfig.addCollection("bab", (api) =>
    api.getFilteredByTag("materi").sort((a, b) => a.data.bab - b.data.bab)
  );

  return {
    dir: { input: "src", output: "_site" },
    pathPrefix: process.env.PATH_PREFIX || "/",
  };
}
