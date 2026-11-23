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
      tombolTandai.querySelector("[data-teks-tandai]").textContent = sudah ? "Sudah selesai" : "Tandai selesai";
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

  // Penanda bagian yang sedang dibaca di daftar modul.
  const tautanBagian = new Map(
    [...document.querySelectorAll("[data-ke-bagian]")].map((a) => [a.dataset.keBagian, a])
  );
  if (tautanBagian.size && "IntersectionObserver" in window) {
    const pengamat = new IntersectionObserver(
      (entri) => {
        entri.forEach((e) => {
          if (!e.isIntersecting) return;
          tautanBagian.forEach((a) => a.classList.remove("aktif"));
          tautanBagian.get(e.target.id)?.classList.add("aktif");
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    document.querySelectorAll(".isi h2[id]").forEach((h) => pengamat.observe(h));
  }

  tampilkan();
})();
