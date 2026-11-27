// Progres belajar (disimpan di perangkat murid), daftar modul, dan penanda bagian aktif.
(() => {
  const KUNCI_PROGRES = "kka-progres-v1";
  const KUNCI_TERAKHIR = "kka-terakhir-v1";

  const baca = (kunci, cadangan) => {
    try { return JSON.parse(localStorage.getItem(kunci)) ?? cadangan; } catch { return cadangan; }
  };
  const simpan = (kunci, nilai) => {
    try { localStorage.setItem(kunci, JSON.stringify(nilai)); } catch { /* penyimpanan tidak tersedia */ }
  };

  const progres = baca(KUNCI_PROGRES, {}); // { "1": "mulai" | "selesai" }
  const totalBab = Number(document.body.dataset.totalBab) || 0;
  const elKelas = document.querySelector("[data-bab-sekarang]");
  const babSekarang = elKelas?.dataset.babSekarang;

  // Halaman materi: catat bab sedang dibaca & halaman terakhir.
  if (babSekarang) {
    if (progres[babSekarang] !== "selesai") progres[babSekarang] = "mulai";
    simpan(KUNCI_PROGRES, progres);
    simpan(KUNCI_TERAKHIR, { url: location.pathname, bab: babSekarang });
  }

  const tampilkan = () => {
    const selesai = Object.values(progres).filter((s) => s === "selesai").length;
    const persen = totalBab ? Math.round((selesai / totalBab) * 100) : 0;

    document.querySelectorAll("[data-progres-bar]").forEach((el) => (el.style.width = persen + "%"));
    document.querySelectorAll("[data-progres-teks]").forEach(
      (el) => (el.textContent = `${selesai} dari ${totalBab} bab selesai · ${persen}%`)
    );
    document.querySelectorAll("[data-status-bab]").forEach((el) => {
      const status = progres[el.dataset.statusBab];
      el.dataset.status = status || "belum";
      el.title = status === "selesai" ? "Selesai" : status === "mulai" ? "Sedang dibaca" : "Belum dibaca";
    });
    document.querySelectorAll("[data-gelembung]").forEach((el) => {
      el.dataset.status = progres[el.dataset.gelembung] || "belum";
    });

    const tombolTandai = document.querySelector("[data-tandai-selesai]");
    if (tombolTandai) {
      const sudah = progres[babSekarang] === "selesai";
      tombolTandai.classList.toggle("sudah-selesai", sudah);
      tombolTandai.querySelector("[data-teks-tandai]").textContent = sudah
        ? "Sudah selesai (ketuk untuk batal)"
        : "Tandai selesai";
      tombolTandai.querySelector(".ikon").textContent = sudah ? "check_circle" : "check";
    }
  };

  // Beranda: tombol "Lanjutkan belajar".
  const terakhir = baca(KUNCI_TERAKHIR, null);
  const tombolLanjut = document.querySelector("[data-tombol-lanjut]");
  if (tombolLanjut && terakhir?.url) {
    tombolLanjut.href = terakhir.url;
    tombolLanjut.querySelector("[data-teks-lanjut]").textContent = `Lanjutkan Bab ${terakhir.bab}`;
  }

  document.querySelector("[data-tandai-selesai]")?.addEventListener("click", () => {
    progres[babSekarang] = progres[babSekarang] === "selesai" ? "mulai" : "selesai";
    simpan(KUNCI_PROGRES, progres);
    tampilkan();
  });

  // Daftar modul (laci di HP).
  const bukaDaftar = (buka) => document.body.classList.toggle("daftar-terbuka", buka);
  document.querySelectorAll("[data-buka-daftar]").forEach((el) => el.addEventListener("click", () => bukaDaftar(true)));
  document.querySelectorAll("[data-tutup-daftar], .daftar-modul a").forEach((el) =>
    el.addEventListener("click", () => bukaDaftar(false))
  );
  document.addEventListener("keydown", (e) => e.key === "Escape" && bukaDaftar(false));

  // Materi per slide: satu bagian tampil, pindah dengan tombol, geser, atau panah keyboard.
  const slide = [...document.querySelectorAll(".slide")];
  if (slide.length) {
    document.body.classList.add("pakai-slide");
    const tombolMundur = document.querySelector("[data-tombol-mundur]");
    const tombolMaju = document.querySelector("[data-tombol-maju]");
    const labelMundur = document.querySelector("[data-label-mundur]");
    const labelMaju = document.querySelector("[data-label-maju]");
    const hrefMundur = tombolMundur.href;
    const hrefMaju = tombolMaju.href;
    const adaBabBerikutnya = !hrefMaju.endsWith("/latihan/");
    const adaBabSebelumnya = !hrefMundur.includes("#silabus");
    const penghitung = document.querySelector("[data-penghitung]");
    const garisSlide = document.querySelector("[data-progres-slide]");
    const tautanSlide = [...document.querySelectorAll(".sub-list [data-ke-slide]")];
    const terakhir = slide.length - 1;
    let posisi = 0;

    const indeksDari = (id) => Math.max(0, slide.findIndex((s) => s.id === id));

    const tampilkanSlide = (ke, gulir = true) => {
      posisi = Math.min(Math.max(ke, 0), terakhir);
      slide.forEach((s, i) => (s.hidden = i !== posisi));
      const id = slide[posisi].id;
      history.replaceState(null, "", posisi === 0 ? location.pathname : "#" + id);

      penghitung.textContent = `${posisi + 1} / ${slide.length}`;
      garisSlide.style.width = ((posisi + 1) / slide.length) * 100 + "%";
      const induk = slide[posisi].dataset.induk || id;
      tautanSlide.forEach((a) => a.classList.toggle("aktif", a.dataset.keSlide === induk));

      labelMundur.textContent = posisi > 0 ? "Sebelumnya" : adaBabSebelumnya ? "Bab sebelumnya" : "Silabus";
      tombolMundur.href = posisi === 0 ? hrefMundur : "#" + slide[posisi - 1].id;
      labelMaju.textContent =
        posisi < terakhir ? "Selanjutnya" : adaBabBerikutnya ? "Bab berikutnya" : "Latihan soal";
      tombolMaju.href = posisi < terakhir ? "#" + slide[posisi + 1].id : hrefMaju;

      // Sampai di slide terakhir = bab selesai dibaca.
      if (posisi === terakhir && progres[babSekarang] !== "selesai") {
        progres[babSekarang] = "selesai";
        simpan(KUNCI_PROGRES, progres);
        tampilkan();
      }
      if (gulir) window.scrollTo({ top: 0, behavior: "instant" });
    };

    const maju = () => posisi < terakhir && tampilkanSlide(posisi + 1);
    const mundur = () => posisi > 0 && tampilkanSlide(posisi - 1);

    tombolMaju.addEventListener("click", (e) => { if (posisi < terakhir) { e.preventDefault(); maju(); } });
    tombolMundur.addEventListener("click", (e) => { if (posisi > 0) { e.preventDefault(); mundur(); } });

    // Tautan ke slide tertentu (daftar modul, isi bab).
    document.querySelectorAll("[data-ke-slide]").forEach((a) =>
      a.addEventListener("click", (e) => {
        e.preventDefault();
        tampilkanSlide(indeksDari(a.dataset.keSlide));
      })
    );

    document.addEventListener("keydown", (e) => {
      if (e.target.closest("input, textarea, summary, .kuis, .jelajahi")) return;
      if (e.key === "ArrowRight") maju();
      if (e.key === "ArrowLeft") mundur();
    });

    // Geser ke kiri/kanan di HP.
    let awalX = null, awalY = 0;
    const area = document.querySelector(".area-belajar");
    area.addEventListener("touchstart", (e) => {
      if (e.target.closest(".tabel, .jelajahi")) return (awalX = null); // tabel & kartu tidak memicu pindah slide
      awalX = e.touches[0].clientX;
      awalY = e.touches[0].clientY;
    }, { passive: true });
    area.addEventListener("touchend", (e) => {
      if (awalX === null) return;
      const dx = e.changedTouches[0].clientX - awalX;
      const dy = e.changedTouches[0].clientY - awalY;
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) (dx < 0 ? maju : mundur)();
      awalX = null;
    }, { passive: true });

    const slideDariAlamat = () => (location.hash ? indeksDari(decodeURIComponent(location.hash.slice(1))) : 0);
    window.addEventListener("hashchange", () => tampilkanSlide(slideDariAlamat()));
    tampilkanSlide(slideDariAlamat(), false);
  }

  // Kuis cek pemahaman: pilih jawaban → periksa → umpan balik langsung.
  document.querySelectorAll("[data-kuis]").forEach((kuis) => {
    const pilihan = [...kuis.querySelectorAll("input[type=radio]")];
    const tombolPeriksa = kuis.querySelector("[data-periksa]");
    const tombolUlangi = kuis.querySelector("[data-ulangi]");
    const umpan = kuis.querySelector("[data-umpan]");
    const judulUmpan = kuis.querySelector("[data-umpan-judul]");

    pilihan.forEach((r) => r.addEventListener("change", () => (tombolPeriksa.disabled = false)));

    tombolPeriksa.addEventListener("click", () => {
      const dipilih = pilihan.find((r) => r.checked);
      if (!dipilih) return;
      const benar = dipilih.hasAttribute("data-benar");
      kuis.classList.add(benar ? "jawaban-benar" : "jawaban-salah");
      dipilih.closest(".pilihan").classList.add(benar ? "pilih-benar" : "pilih-salah");
      pilihan.forEach((r) => (r.disabled = true));
      judulUmpan.textContent = benar ? "Benar! Hebat 🎉" : "Belum tepat. Baca lagi pilihannya, lalu coba lagi ya!";
      umpan.hidden = false;
      tombolPeriksa.hidden = true;
      tombolUlangi.hidden = benar;
    });

    tombolUlangi.addEventListener("click", () => {
      kuis.classList.remove("jawaban-benar", "jawaban-salah");
      kuis.querySelectorAll(".pilihan").forEach((p) => p.classList.remove("pilih-benar", "pilih-salah"));
      pilihan.forEach((r) => { r.disabled = false; r.checked = false; });
      umpan.hidden = true;
      tombolUlangi.hidden = true;
      tombolPeriksa.hidden = false;
      tombolPeriksa.disabled = true;
    });
  });

  // Kartu jelajahi: ketuk tombol (+) untuk membuka penjelasan, geser dengan ‹ ›.
  document.querySelectorAll("[data-jelajahi]").forEach((wadah) => {
    const tombol = [...wadah.querySelectorAll("[data-buka]")];
    const isi = [...wadah.querySelectorAll("[data-isi]")];
    const panel = wadah.querySelector("[data-panel]");
    const hitung = wadah.querySelector("[data-hitung]");
    const progresTeks = wadah.querySelector("[data-progres-jelajahi]");
    const dibuka = new Set();
    let aktif = -1;

    const buka = (i) => {
      aktif = (i + isi.length) % isi.length;
      panel.hidden = false;
      isi.forEach((el, k) => (el.hidden = k !== aktif));
      tombol.forEach((t, k) => t.classList.toggle("aktif", k === aktif));
      dibuka.add(aktif);
      tombol[aktif].classList.add("sudah");
      tombol[aktif].querySelector(".ikon").textContent = "check";
      hitung.textContent = `${aktif + 1} dari ${isi.length}`;
      panel.scrollIntoView({ block: "nearest", behavior: "smooth" });
      const semua = dibuka.size === isi.length;
      wadah.classList.toggle("semua-dibuka", semua);
      progresTeks.textContent = semua
        ? "Hebat, semua kartu sudah kamu buka! 🎉"
        : `${dibuka.size} dari ${isi.length} sudah dibuka`;
    };

    tombol.forEach((t) => t.addEventListener("click", () => buka(Number(t.dataset.buka))));
    wadah.querySelectorAll("[data-geser]").forEach((t) =>
      t.addEventListener("click", () => buka(aktif + Number(t.dataset.geser)))
    );
    wadah.querySelector("[data-tutup]").addEventListener("click", () => {
      panel.hidden = true;
      tombol.forEach((t) => t.classList.remove("aktif"));
    });
  });

  tampilkan();
})();
