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

  // Memecah isi satu bab menjadi slide agar dibaca per layar, bukan digulir panjang.
  // - Satu bagian (## ) = satu slide.
  // - Bagian yang punya sub-judul (### ) dipecah lagi per sub-judul.
  // - Kotak Refleksi (beserta kunci jawaban) mendapat slide sendiri.
  // Hasil: { pembuka, bagian: [{ id, teks }], slide: [{ id, html, induk, indukTeks, lanjutan }] }
  const PEMISAH_SUB = /(?=<h3>|<div class="kotak kotak-refleksi">)/;
  eleventyConfig.addFilter("potongSlide", (html = "") => {
    const potongan = html.split(/(?=<h2>)/);
    const pembuka = potongan[0].startsWith("<h2>") ? "" : potongan.shift();
    const bagian = [];
    const slide = [];
    for (const isiBagian of potongan) {
      const teks = tanpaTag(isiBagian.match(/<h2>([\s\S]*?)<\/h2>/)[1]);
      const id = slugify(teks);
      bagian.push({ id, teks });
      const sub = isiBagian.split(PEMISAH_SUB);
      // Judul bagian yang hanya diikuti teks pendek digabung dengan sub-bagian pertama.
      if (sub.length > 1 && tanpaTag(sub[0].replace(/<h2>[\s\S]*?<\/h2>/, "")).length < 200) {
        sub.splice(0, 2, sub[0] + sub[1]);
      }
      sub.forEach((isi, k) =>
        slide.push({ id: k ? `${id}-${k + 1}` : id, html: isi, induk: id, indukTeks: teks, lanjutan: k > 0 })
      );
    }
    return { pembuka, bagian, slide };
  });

  return {
    dir: { input: "src", output: "_site" },
    pathPrefix: process.env.PATH_PREFIX || "/",
  };
}
