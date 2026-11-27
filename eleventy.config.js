import { HtmlBasePlugin } from "@11ty/eleventy";

// ---------- Komponen interaktif di dalam materi ----------
let nomorKuis = 0;

/*
```kuis
Pertanyaan: teks pertanyaan
- pilihan salah
* pilihan benar (diawali bintang)
Penjelasan: alasan jawaban benar
```
*/
function buatKuis(isi, md) {
  const tanya = [];
  const pilihan = [];
  let penjelasan = "";
  for (const baris of isi.split("\n").map((b) => b.trim()).filter(Boolean)) {
    if (/^[-*] /.test(baris)) pilihan.push({ teks: baris.slice(2), benar: baris[0] === "*" });
    else if (/^penjelasan:/i.test(baris)) penjelasan = baris.replace(/^penjelasan:\s*/i, "");
    else if (penjelasan) penjelasan += " " + baris;
    else tanya.push(baris.replace(/^pertanyaan:\s*/i, ""));
  }
  const nama = `kuis-${++nomorKuis}`;
  const daftar = pilihan
    .map(
      (p, i) =>
        `<label class="pilihan"><input type="radio" name="${nama}" value="${i}"${p.benar ? " data-benar" : ""}>` +
        `<span class="pilihan-tanda" aria-hidden="true"></span><span class="pilihan-teks">${md.renderInline(p.teks)}</span></label>`
    )
    .join("");
  return `<div class="kuis" data-kuis>
<p class="kuis-label"><span class="ikon">quiz</span>Pilih satu jawaban</p>
<p class="kuis-tanya">${md.renderInline(tanya.join(" "))}</p>
<div class="kuis-pilihan" role="radiogroup">${daftar}</div>
<div class="kuis-umpan" data-umpan hidden aria-live="polite"><p class="kuis-umpan-judul" data-umpan-judul></p><p class="kuis-penjelasan">${md.renderInline(penjelasan)}</p></div>
<div class="grup-tombol"><button class="tombol tombol-filled" type="button" data-periksa disabled>Periksa jawaban</button><button class="tombol tombol-teks" type="button" data-ulangi hidden><span class="ikon">refresh</span>Coba lagi</button></div>
</div>
`;
}

/*
```jelajahi
Petunjuk: Ketuk setiap tombol untuk mempelajari ...
# Judul kartu pertama
Isi kartu (boleh beberapa paragraf, **tebal**, daftar).
# Judul kartu kedua
...
```
*/
function buatJelajahi(isi, md) {
  const kartu = [];
  let petunjuk = "Ketuk setiap tombol (+) untuk membuka penjelasannya.";
  for (const baris of isi.split("\n")) {
    if (/^petunjuk:/i.test(baris.trim())) petunjuk = baris.trim().replace(/^petunjuk:\s*/i, "");
    else if (baris.startsWith("# ")) kartu.push({ judul: baris.slice(2).trim(), isi: [] });
    else if (kartu.length) kartu.at(-1).isi.push(baris);
  }
  const tombol = kartu
    .map(
      (k, i) =>
        `<button class="titik-info" type="button" data-buka="${i}"><span class="titik-info-ikon"><span class="ikon">add</span></span><span>${md.renderInline(k.judul)}</span></button>`
    )
    .join("");
  const panel = kartu
    .map(
      (k, i) =>
        `<div class="jelajahi-isi" data-isi="${i}" hidden><p class="jelajahi-judul">${md.renderInline(k.judul)}</p>${md.render(k.isi.join("\n"))}</div>`
    )
    .join("");
  return `<div class="jelajahi" data-jelajahi>
<p class="jelajahi-petunjuk"><span class="ikon">touch_app</span>${md.renderInline(petunjuk)}</p>
<div class="jelajahi-tombol">${tombol}</div>
<div class="jelajahi-panel" data-panel hidden>
<div class="jelajahi-nav"><span class="jelajahi-hitung" data-hitung></span><button class="tombol-ikon" type="button" data-geser="-1" aria-label="Kartu sebelumnya"><span class="ikon">chevron_left</span></button><button class="tombol-ikon" type="button" data-geser="1" aria-label="Kartu berikutnya"><span class="ikon">chevron_right</span></button><button class="tombol-ikon" type="button" data-tutup aria-label="Tutup"><span class="ikon">close</span></button></div>
${panel}
</div>
<p class="jelajahi-progres" data-progres-jelajahi>0 dari ${kartu.length} sudah dibuka</p>
</div>
`;
}

export default function (eleventyConfig) {
  // Menyesuaikan semua link "/..." dengan alamat GitHub Pages (misal /materi-kka-fasec/).
  eleventyConfig.addPlugin(HtmlBasePlugin);
  eleventyConfig.addPassthroughCopy("src/assets");

  // Alamat web yang tertulis di materi otomatis menjadi link yang bisa diklik.
  // Blok ```kuis dan ```jelajahi di materi diubah menjadi komponen interaktif.
  eleventyConfig.amendLibrary("md", (md) => {
    md.set({ linkify: true });
    const fenceAsli = md.renderer.rules.fence;
    md.renderer.rules.fence = (tokens, idx, options, env, self) => {
      const jenis = tokens[idx].info.trim();
      if (jenis === "kuis") return buatKuis(tokens[idx].content, md);
      if (jenis === "jelajahi") return buatJelajahi(tokens[idx].content, md);
      return fenceAsli(tokens, idx, options, env, self);
    };
  });

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
