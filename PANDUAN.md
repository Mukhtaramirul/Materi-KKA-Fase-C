# Panduan Website Materi KKA Fase C

## A. Menerbitkan pertama kali (cukup sekali)

1. Buka **GitHub Desktop** → menu **File → Add local repository…**
2. Pilih folder `C:\Users\User\materi-kka-fasec`.
3. Muncul tulisan *"This directory does not appear to be a Git repository"* → klik **create a repository**.
   - Name: `materi-kka-fasec` → klik **Create repository**.
4. Klik **Publish repository** (tombol biru di atas).
   - **Hapus centang** "Keep this code private" (GitHub Pages gratis hanya untuk repo publik).
5. Buka repo di github.com → **Settings → Pages** → bagian *Build and deployment*, *Source* pilih **GitHub Actions**.
6. Buka tab **Actions** → pilih **Terbitkan website** → klik **Run workflow**.
   Tunggu 1–2 menit sampai tanda centang hijau.
7. Website aktif di: `https://USERNAME.github.io/materi-kka-fasec/`
   (ganti USERNAME dengan username GitHub Anda).

## B. Cara memperbarui

Setelah mengubah file, buka GitHub Desktop → isi kolom *Summary* (misal "ganti link soal") →
**Commit to main** → **Push origin**. Website diperbarui otomatis dalam 1–2 menit.

Bisa juga langsung di github.com: buka file → ikon pensil ✏️ → ubah → **Commit changes**.

| Ingin… | Ubah file ini |
|---|---|
| Menambah / mengganti link Google Form | `src/_data/latihan.json` |
| Mengubah isi materi suatu bab | `src/materi/bab-1.md` … `bab-5.md` |
| Menambah bab baru | Salin `bab-5.md` → beri nama `bab-6.md` → ubah `bab: 6`, `judul`, `tujuan`, dan isinya |
| Mengganti file PDF | Timpa `src/assets/pdf/Materi-KKA-Fase-C-Semester-1.pdf` (nama file harus sama) |
| Menambah gambar | Taruh di `src/assets/img/`, lalu tulis `![keterangan](/assets/img/nama-file.jpg)` di materi |

### Contoh menambah link soal di `latihan.json`
Tambahkan satu blok di dalam daftar `"soal"` kelas yang sesuai (perhatikan tanda koma di antara blok):

```json
{
  "judul": "Latihan Soal Bab 6",
  "link": "https://docs.google.com/forms/d/e/.../viewform"
}
```

⚠️ Gunakan **link untuk siswa** (berakhiran `/viewform`), **jangan** link edit form.

### Cara menulis materi (format Markdown)
- `## Judul Bagian` → subjudul besar, `### Judul Kecil` → subjudul kecil
- `**teks**` → **tebal**
- Baris diawali `1. ` → daftar bernomor, diawali `- ` → daftar berpoin
- Beri satu baris kosong di antara paragraf.
- Setiap `##` dan `###` otomatis menjadi slide baru (murid menekan **Selanjutnya**).

### Menambah kuis cek pemahaman (umpan balik langsung)
Tulis blok ini di file bab. Pilihan benar diawali `*`, pilihan salah diawali `-`:

````
### Pertanyaan 1

```kuis
Pertanyaan: Blok "ketika bendera hijau diklik" termasuk kategori …
- Gerakan (biru)
* Kejadian (kuning)
- Suara (merah muda)
Penjelasan: Blok Kejadian menentukan kapan program mulai berjalan.
```
````

Penjelasan hanya muncul setelah murid menjawab benar. Jika salah, murid diminta mencoba lagi.

### Menambah kartu jelajahi (tombol + yang diketuk)
Setiap baris yang diawali `# ` menjadi satu kartu:

````
```jelajahi
Petunjuk: Ketuk setiap tombol (+) untuk mempelajari 3 jenis algoritma.
# Sekuensial
Langkah dikerjakan urut, satu per satu.
# Percabangan
Ada pilihan langkah berdasarkan syarat (JIKA … MAKA …).
# Perulangan
Langkah yang sama diulang sampai selesai.
```
````

## C. Agar muncul di Google (cukup sekali, setelah website aktif)

1. Buka https://search.google.com/search-console → login dengan akun Google.
2. Tambah properti → pilih **Awalan URL** → isi `https://USERNAME.github.io/materi-kka-fasec/`.
3. Verifikasi dengan metode **Tag HTML**: salin kode `<meta name="google-site-verification" ...>`,
   tempel di `src/_includes/base.njk` tepat di bawah baris `<meta charset="utf-8">`, lalu commit & push.
   Setelah 1–2 menit klik **Verifikasi**.
4. Menu **Sitemap** → isi `sitemap.xml` → **Kirim**.

Google biasanya butuh beberapa hari sampai beberapa minggu untuk menampilkan website baru.

## D. Melihat website di komputer sendiri (opsional)
Buka terminal di folder ini, jalankan `npm install` sekali, lalu `npm start` dan buka http://localhost:8080
