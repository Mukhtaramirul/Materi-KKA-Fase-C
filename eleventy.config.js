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

  // ---- Bantuan untuk tampilan kelas (silabus, daftar isi, waktu baca) ----
  const slugify = eleventyConfig.getFilter("slugify");
  const tanpaTag = (html) => html.replace(/<[^>]+>/g, "").trim();
  const JUDUL_BAGIAN = /<h2>([\s\S]*?)<\/h2>/g;

  // Daftar bagian (judul ## ) dalam satu bab: [{ id, teks }]
  eleventyConfig.addFilter("bagian", (html = "") =>
    [...html.matchAll(JUDUL_BAGIAN)].map((m) => {
      const teks = tanpaTag(m[1]);
      return { id: slugify(teks), teks };
    })
  );

  // Perkiraan waktu baca (menit), memakai kecepatan baca anak ±100 kata/menit.
  const menitBaca = (html = "") =>
    Math.max(1, Math.round(tanpaTag(html).split(/\s+/).length / 100));
  eleventyConfig.addFilter("menitBaca", menitBaca);
  eleventyConfig.addFilter("totalMenit", (items = []) =>
    items.reduce((jumlah, item) => jumlah + menitBaca(item.templateContent), 0)
  );

  eleventyConfig.addFilter("cariBab", (items = [], nomor) => items.find((item) => item.data.bab === nomor));

  // Memberi id pada judul bagian di halaman materi agar bisa dituju dari daftar isi.
  eleventyConfig.addTransform("idJudulBagian", function (isi) {
    if (!this.page.outputPath?.endsWith(".html") || !this.page.url.startsWith("/materi/")) return isi;
    return isi.replace(JUDUL_BAGIAN, (_, teks) => `<h2 id="${slugify(tanpaTag(teks))}">${teks}</h2>`);
  });

  return {
    dir: { input: "src", output: "_site" },
    pathPrefix: process.env.PATH_PREFIX || "/",
  };
}
