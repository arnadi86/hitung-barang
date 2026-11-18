
const btnPengumuman = document.querySelector("#btnPengumuman");
const modalPengumuman = document.querySelector("#modalPengumuman");
const daftarPengumumanEl = document.querySelector("#daftarPengumuman");
const badgePengumuman = document.querySelector("#badgePengumuman");

// isi pesan pengumuman
const daftarPengumuman = [
  {
    id: 1,
    judul: "Selamat Datang",
    tanggal: "2026-11-18",
    isi: "Selamat menggunakan aplikasi Hitung Barang.",
    penting: false
  },
  /*{
    id: 2,
    judul: "Pembaruan Aplikasi",
    tanggal: "2026-11-18",
    isi: "Ada pembaruan fitur pada aplikasi.",
    penting: false
  }*/
];

const KEY_PENGUMUMAN = "pengumumanSudahDibaca";

function ambilPengumumanDibaca() {
  return JSON.parse(
    localStorage.getItem(KEY_PENGUMUMAN) || "[]"
  );
}

function tampilkanPengumuman() {

  const sudahDibaca = ambilPengumumanDibaca();

  const sekarang = new Date();
  const batasWaktu = new Date(sekarang);

  batasWaktu.setDate(batasWaktu.getDate() - 30);
  batasWaktu.setHours(0, 0, 0, 0);

  // Pengumuman dalam 30 hari terakhir
  const pengumumanBaru = daftarPengumuman.filter(item => {

    const tanggal = new Date(item.tanggal + "T00:00:00");

    return !isNaN(tanggal.getTime()) &&
      tanggal >= batasWaktu &&
      tanggal <= sekarang;
  });

  // Hitung yang belum dibaca
  const belumDibaca = pengumumanBaru.filter(item =>
    !sudahDibaca.includes(item.id)
  );

  // Tampilkan atau sembunyikan tanda merah
  badgePengumuman.style.display =
    belumDibaca.length > 0 ? "block" : "none";

  daftarPengumumanEl.innerHTML = "";

  // Tetap tampilkan seluruh riwayat
  
  daftarPengumuman.forEach(item => {
  
    const dibaca = sudahDibaca.includes(item.id);
  
    const tanggalItem = new Date(item.tanggal + "T00:00:00");
  
    const masihBaru =
      !isNaN(tanggalItem.getTime()) &&
      tanggalItem >= batasWaktu &&
      tanggalItem <= sekarang;
  
    const bagian = document.createElement("div");
  
    bagian.className = "itemPengumuman";
  
    if (masihBaru && !dibaca) {
      bagian.classList.add("belumDibaca");
    }
  
    if (!masihBaru) {
      bagian.classList.add("arsipLama");
    }
  
    if (item.penting) {
      bagian.classList.add("penting");
    }
  
    const judul = document.createElement("h4");
    judul.textContent = item.judul;
  
    const tanggal = document.createElement("small");
    tanggal.textContent = tanggalItem.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  
    const isi = document.createElement("p");
    isi.textContent = item.isi;
  
    bagian.append(judul, tanggal, isi);
  
    // Label status
    const label = document.createElement("span");
    label.className = "labelPengumuman";
  
    if (!masihBaru) {
      label.textContent = "ARSIP";
      label.classList.add("labelArsip");
  
    } else if (dibaca) {
      label.textContent = "SUDAH DIBACA";
      label.classList.add("labelDibaca");
  
    } else {
      label.textContent = "BARU";
      label.classList.add("labelBaru");
    }
  
    bagian.appendChild(label);
  
    // Label penting
    if (item.penting) {
      const labelPenting = document.createElement("span");
  
      labelPenting.className = "labelPengumuman labelPenting";
      labelPenting.textContent = "PENTING";
  
      bagian.appendChild(labelPenting);
    }
  
    // Tandai sudah dibaca
    bagian.addEventListener("click", () => {
  
      if (!sudahDibaca.includes(item.id)) {
  
        sudahDibaca.push(item.id);
  
        localStorage.setItem(
          KEY_PENGUMUMAN,
          JSON.stringify(sudahDibaca)
        );
  
        tampilkanPengumuman();
      }
  
    });
  
    daftarPengumumanEl.appendChild(bagian);
  
  });

}

btnPengumuman.addEventListener("click", () => {
  modalPengumuman.classList.add("show");
  tampilkanPengumuman();
});

document.querySelector("#tutupPengumuman")
  .addEventListener("click", () => {
    modalPengumuman.classList.remove("show");
  });

// Periksa pengumuman saat aplikasi dibuka
tampilkanPengumuman();