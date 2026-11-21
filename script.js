// membuat database
let db;
function bukaDatabase() {

  return new Promise((resolve, reject) => {

    const request = indexedDB.open("DatabaseToko", 3);

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // Object Store produk
      if (!database.objectStoreNames.contains("produk")) {
        database.createObjectStore("produk", {
          keyPath: "id",
          autoIncrement: true
        });
      }

      // Object Store rincian
      if (!database.objectStoreNames.contains("rincian")) {
        database.createObjectStore("rincian", {
          keyPath: "id",
          autoIncrement: true
        });
      }
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };

    request.onerror = () => {
      reject(request.error);
    };

  });

}

// menambahkan produk
async function tambahProduk(data) {

  const transaksi = db.transaction(
    "produk",
    "readwrite"
  );

  const store = transaksi.objectStore("produk");

  const request = store.add(data);

  return new Promise((resolve, reject) => {

    transaksi.oncomplete = () => {
      resolve(request.result);
    };

    transaksi.onerror = () => {
      reject(transaksi.error);
    };

    transaksi.onabort = () => {
      reject(transaksi.error);
    };

  });

}

// ambil semua produk
// kode baru
async function ambilSemuaProduk() {

  // Pastikan database sudah dibuka
  if (!db) {
    await bukaDatabase();
  }

  const transaksi = db.transaction(
    "produk",
    "readonly"
  );

  const store = transaksi.objectStore("produk");

  const request = store.getAll();

  return new Promise((resolve, reject) => {

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };

  });

}
/** kode lama
async function ambilSemuaProduk() {

  const transaksi = db.transaction(
    "produk",
    "readonly"
  );

  const store = transaksi.objectStore("produk");

  const request = store.getAll();

  return new Promise((resolve, reject) => {

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };

  });

}
*/

// modal alert
function modalAlert(teksJudul, teksPesan, teksTombol) {
  const modal = document.createElement("div");
  const box = document.createElement("div");
  const row1 = document.createElement("div");
  const row2 = document.createElement("div");
  const row3 = document.createElement("div");
  const judul = document.createElement("h3");
  const pesan = document.createElement("p");
  const tombol = document.createElement("button");

  modal.classList.add("modal", "show", "max-top");
  box.classList.add("box");
  row1.classList.add("row");
  row2.classList.add("row");
  row3.classList.add("row", "center", "mt-20");
  tombol.classList.add("close");
  
  judul.textContent = teksJudul;
  pesan.textContent = teksPesan;
  tombol.textContent = teksTombol;

  row1.appendChild(judul);
  row2.appendChild(pesan);
  row3.appendChild(tombol);
  box.appendChild(row1);
  box.appendChild(row2);
  box.appendChild(row3);
  modal.appendChild(box);
  document.body.appendChild(modal);
  
  tombol.addEventListener("mousedown", () => {
    kolomSebelumnya = document.activeElement;
  });

  tombol.addEventListener("click", () => {
    modal.remove();
    kolomSebelumnya?.focus();
  });
}

const tabelRincian = document.querySelector("#tabelRincian");
const menuHitung = document.querySelector('[data-menu="hitung"]');
const menuLihatBackup = document.querySelector('[data-menu="lihatBackup"]');
const menuBackup = document.querySelector('[data-menu="backup"]');
const menuKirimLaporan = document.querySelector('[data-menu="kirimLaporan"]');
const menuBantuan = document.querySelector('[data-menu="bantuan"]');
const menuDukungan = document.querySelector('[data-menu="dukungan"]');
const menuDokumentasi = document.querySelector('[data-menu="dokumentasi"]');
const menuLaporkan = document.querySelector('[data-menu="laporkan"]');
const dukunganRincian = document.querySelector("#dukunganRincian");
const starting = document.querySelector("#starting");
// tampilkan produk
let produkTerbaruId = null;
async function tampilkanProduk() {

  const data = await ambilSemuaProduk();

  const container = document.querySelector("#tables");
  container.innerHTML = "";

  // Format angka Indonesia
  const formatAngka = new Intl.NumberFormat("id-ID");

  // Mengambil semua ukuran unik
  const urutanUkuran = [
    "4 kg",
    "5 kg",
    "8 kg",
    "10 kg",
    "16 kg",
    "20 kg",
    "25 kg",
    "50 kg",
    "48 kg",
    "eceran",
    "bukaan",
    ""
  ];

  const ukuranUnik = urutanUkuran.filter(
    ukuran => data.some(produk => produk.ukuran === ukuran)
  );

  ukuranUnik.forEach(ukuran => {

    // Filter produk berdasarkan ukuran
    const produkUkuran = data.filter(
      produk => produk.ukuran === ukuran
    );

    // Menghitung total jumlah
    const totalJumlah = produkUkuran.reduce(
      (total, produk) => total + produk.jumlah,
      0
    );

    let ukuranAsli;
    if (ukuran === "eceran" || ukuran === "bukaan" || ukuran === "") {
      ukuranAsli = 1;
    } else {
      ukuranAsli = Number(parseFloat(ukuran));
    }

    // Menghitung total nilai stok
    const totalHarga = produkUkuran.reduce(
      (total, produk) => total + (((produk.harga * ukuranAsli) + produk.kemasan) * produk.jumlah),
      0
    );

    // Membuat tabel
    const tabBox = document.createElement("div");
    const tabTitle = document.createElement("h3");
    tabBox.classList.add("tab-box");

    const tabel = document.createElement("table");

    tabel.innerHTML = `
      <thead>
        <tr>
          <th>No</th>
          <th>Merek</th>
          <th>Byk</th>
          <th>Modal</th>
          <th>Jumlah</th>
          <th>Aksi</th>
        </tr>
      </thead>

      <tbody>
        ${produkUkuran.map((produk, i) => 
          `
          <tr data-produk-id="${produk.id}">
            <td>${i + 1}</td>
            <td class="start">${produk.merek}</td>
            <td>${formatStok(produk.jumlah)}</td>
            <td class="end">${formatAngka.format((produk.harga * ukuranAsli) + produk.kemasan)}</td>
            <td class="end">${formatAngka.format(((produk.harga * ukuranAsli) + produk.kemasan) * produk.jumlah)}</td>
            <td>
              <div>
                <span onclick="editProduk(${produk.id})"><i class="fa-solid fa-square-pen"></i></span>
                <span onclick="bukaModalHapus(${produk.id})"><i class="fa-solid fa-square-xmark"></i></span>
              </div>
            </td>
          </tr>
        `).join("")}
      </tbody>
    `;

    // Judul ukuran
    tabTitle.textContent = `${ukuran ? `Beras ${ukuran}` : "Salah ukuran"}`;

    let textUkuran = "";
    if (ukuran === "eceran" || ukuran === "bukaan" || ukuran === "") {
      textUkuran = " kg";
    } else {
      textUkuran = " karung";
    }

    // Footer tabel
    const tabFoot = document.createElement("div");
    tabFoot.classList.add("footer");

    const span1 = document.createElement("span");
    const span2 = document.createElement("span");
    const span3 = document.createElement("span");

    span1.textContent = "Total";
    span2.textContent = `${formatStok(totalJumlah)} ${textUkuran}`;
    span3.textContent = formatAngka.format(totalHarga);

    tabFoot.appendChild(span1);
    tabFoot.appendChild(span2);
    tabFoot.appendChild(span3);

    // Memasukkan elemen ke halaman
    tabBox.appendChild(tabTitle);
    tabBox.appendChild(tabel);
    tabBox.appendChild(tabFoot);

    container.appendChild(tabBox);

  });

  if (produkTerbaruId !== null) {

    const barisTerbaru = container.querySelector(
      `[data-produk-id="${produkTerbaruId}"]`
    );
  
    if (barisTerbaru) {

      barisTerbaru.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    
      barisTerbaru.classList.add("baris-produk-baru");
    
      setTimeout(() => {
        barisTerbaru.classList.remove("baris-produk-baru");
      }, 3000);
    
    }
  
    produkTerbaruId = null;
  }

  const totalBeras = await hitungTotalBeras();

  if (totalBeras === 0) {
    dukunganRincian.classList.remove("show");
    tabelRincian.classList.remove("show");
    starting.classList.add("show");
  } else {
    starting.classList.remove("show")
    dukunganRincian.classList.add("show");
    tabelRincian.classList.add("show");
  }

}

// edit produk
let idProdukEdit = null;

async function editProduk(id) {
  const produk = await ambilProdukById(id);

  if (!produk) {
    modalAlert("Tidak ditemukan", "Produk tidak ditemukan! Silakan coba lagi atau refresh halaman.", "Coba lagi");
    return;
  }

  modalProduk.classList.add("show");

  idProdukEdit = id;

  merek.value = produk.merek;
  harga.value = formatStok(produk.harga);
  kemasan.value = formatStok(produk.kemasan);
  banyak.value = formatStok(produk.jumlah);
  ukuran.value = produk.ukuran;
}

// hapus produk
let idProdukHapus = null;

const modalHapus = document.querySelector("#modalHapus");

const batalHapus = document.querySelector("#batalHapus");

const konfirmasiHapus = document.querySelector("#konfirmasiHapus");

// batal hapus produk
batalHapus.addEventListener("click", () => {
  tutupModalHapus();
});

// buka modal hapus produk
function bukaModalHapus(id) {
  idProdukHapus = id;
  modalHapus.classList.add("show", "max-top");
}

// tutup modal hapus
function tutupModalHapus() {
  modalHapus.classList.remove("show", "max-top");
  idProdukHapus = null;
}

// konfirmasi hapus produk
konfirmasiHapus.addEventListener("click", async () => {

  if (idProdukHapus === null) return;

  const id = idProdukHapus;

  try {
    await hapusProdukDB(id);

    tutupModalHapus();

    await tampilkanProduk();
    await hitungTotalBeras();
    await tampilkanRincian();

  } catch (error) {
    console.error(error);
    modalAlert("Gagal", "Produk yang dipilih gagal dihapus!", "Coba lagi");
  }

});

// hapus produk
async function hapusProdukDB(id) {
  const transaksi = db.transaction("produk", "readwrite");
  const store = transaksi.objectStore("produk");

  store.delete(id);

  return new Promise((resolve, reject) => {
    transaksi.oncomplete = () => resolve();
    transaksi.onerror = () => reject(transaksi.error);
    transaksi.onabort = () => reject(transaksi.error);
  });
}

// ambil produk berdasarkan id
async function ambilProdukById(id) {
  const transaksi = db.transaction("produk", "readonly");
  const store = transaksi.objectStore("produk");

  return new Promise((resolve, reject) => {
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// hitung total beras
async function hitungTotalBeras() {

  const data = await ambilSemuaProduk();

  const totalBeras = data.reduce(
    (total, produk) => {
      let ukuranAsli;
      if (produk.ukuran === "eceran" || produk.ukuran === "bukaan" || produk.ukuran === "") {
        ukuranAsli = 1;
      } else {
        ukuranAsli = Number(parseFloat(produk.ukuran));
      }
      return total + (((produk.harga * ukuranAsli) + produk.kemasan) * produk.jumlah);
    },
    0
  );

  document.querySelector("#totalberas").textContent =
    totalBeras.toLocaleString("id-ID");
  return totalBeras;

}

const btnOpen = document.querySelector("#btnOpen");
const modalProduk = document.querySelector("#modalProduk");
const merek = document.querySelector("#merek");
const harga = document.querySelector("#harga");
const kemasan = document.querySelector("#kemasan");
const banyak = document.querySelector("#banyak");
const ukuran = document.querySelector("#ukuran");
const close = document.querySelector("#close");
const clear = document.querySelector("#clear");
const save = document.querySelector("#save");

merek.addEventListener("input", () => {
  const posisi = merek.selectionStart;
  merek.value = formatTeks(merek.value);
  merek.setSelectionRange(posisi, posisi);
});
  
harga.addEventListener("input", () => {
  harga.value = formatRupiah(harga.value);
});

kemasan.addEventListener("input", () => {
  kemasan.value = formatRupiah(kemasan.value);
});

banyak.addEventListener("input", () => {
  formatInputStok(banyak);
});

merek.addEventListener("keydown", function(event) {
  if (event.key === "Enter") {
  event.preventDefault();
  harga.focus();
  }
});

btnOpen.addEventListener("click", () => {
  modalProduk.classList.add("show");
  setTimeout(() => {
    merek.focus();
  }, 350);

  let ukuranProduk = localStorage.getItem("ukuranProduk");
  let kemasanProduk = localStorage.getItem("kemasanProduk");

  if (ukuranProduk) {
    kemasan.value = formatStok(kemasanProduk);
    ukuran.value = ukuranProduk ? ukuranProduk : "0";
  } else {
    kemasan.value = formatStok(3000);
    ukuran.value = "5 kg";
  }
});


let setUkuran = "";
let setKemasan = "";
ukuran.addEventListener("change", () => {
  localStorage.removeItem("ukuranProduk");
  localStorage.removeItem("kemasanProduk");
  
  let valUkuran = ukuran.value;
  
  if (valUkuran === "4 kg") {
    kemasan.value = formatStok(2500);
    setKemasan = "2500";
    setUkuran = "4 kg";
  }
  
  if (valUkuran === "5 kg") {
    kemasan.value = formatStok(3000);
    setKemasan = "3000";
    setUkuran = "5 kg";
  }
  
  if (valUkuran === "8 kg") {
    kemasan.value = formatStok(3000);
    setKemasan = "3000";
    setUkuran = "8 kg";
  }
  
  if (valUkuran === "10 kg") {
    kemasan.value = formatStok(3000);
    setKemasan = "3000";
    setUkuran = "10 kg";
  }
  
  if (valUkuran === "16 kg") {
    kemasan.value = formatStok(4000);
    setKemasan = "4000";
    setUkuran = "16 kg";
  }
  
  if (valUkuran === "20 kg") {
    kemasan.value = formatStok(4000);
    setKemasan = "4000";
    setUkuran = "20 kg";
  }
  
  if (valUkuran === "25 kg") {
    kemasan.value = formatStok(4000);
    setKemasan = "4000";
    setUkuran = "25 kg";
  }
  
  if (valUkuran === "48 kg") {
    kemasan.value = "0";
    setKemasan = "0";
    setUkuran = "48 kg";
  }
  if (valUkuran === "50 kg") {
    kemasan.value = "0";
    setKemasan = "0";
    setUkuran = "50 kg";
  }
  
  if (valUkuran === "eceran") {
    kemasan.value = "0";
    setKemasan = "0";
    setUkuran = "eceran";
  }
  
  if (valUkuran === "bukaan") {
    kemasan.value = "0";
    setKemasan = "0";
    setUkuran = "bukaan";
  }

  setTimeout(() => {
    if (merek.value.trim() === "") {
      merek.focus();
    } else if (harga.value === "") {
      harga.focus();
    } else {
      banyak.focus();
    }
  }, 300);

  localStorage.setItem("ukuranProduk", setUkuran);
  localStorage.setItem("kemasanProduk", setKemasan);
});

close.addEventListener("click", () => {
  idProdukEdit = null;
  closeModal();
  clearModal();
});

clear.addEventListener("click", () => {
  merek.focus();
  clearModal();
});

const semuaKolom = [
  document.querySelector("#merek"),
  document.querySelector("#ukuran"),
  document.querySelector("#harga"),
  document.querySelector("#kemasan"),
  document.querySelector("#banyak")
];

semuaKolom.forEach((kolom, index) => {

  kolom.addEventListener("keydown", function(e) {

    if (e.key !== "Enter") return;

    e.preventDefault();

    const berikutnya = semuaKolom
      .slice(index + 1)
      .find(el =>
        el &&
        !el.disabled &&
        !el.readOnly &&
        el.value.trim() === ""
      );

    if (berikutnya) {

      berikutnya.focus();

    } else {

      const semuaTerisi = semuaKolom.every(el =>
        el &&
        el.value.trim() !== ""
      );

      if (semuaTerisi) {
        document.querySelector("#save").click();
      }

    }

  });

});

const toggleAuto = document.querySelector("#toggleAuto") ;
const dataStatus = document.querySelector('[data-status]');
const toggleIcon = document.querySelector("#toggleIcon");

let kolomSebelumnya;

toggleAuto.addEventListener("mousedown", () => {
  kolomSebelumnya = document.activeElement;
});

toggleAuto.addEventListener("click", () => {
  toggleOnOff();
  kolomSebelumnya?.focus();
});

const cekStatusToggle = localStorage.getItem("autoModalProduk");
if (cekStatusToggle && cekStatusToggle === "aktif") {
  dataStatus.dataset.status = "on";
  toggleIcon.classList.remove("fa-solid", "fa-toggle-off");
  toggleIcon.classList.add("fa-solid", "fa-toggle-on");
} else {
  dataStatus.dataset.status = "off";
  toggleIcon.classList.remove("fa-solid", "fa-toggle-on");
  toggleIcon.classList.add("fa-solid", "fa-toggle-off");
}

function toggleOnOff() {
  if (dataStatus.dataset.status === "off") {
    dataStatus.dataset.status = "on";
    toggleIcon.classList.remove("fa-solid", "fa-toggle-off");
    toggleIcon.classList.add("fa-solid", "fa-toggle-on");
    localStorage.setItem("autoModalProduk", "aktif");
  } else {
    dataStatus.dataset.status = "off";
    toggleIcon.classList.remove("fa-solid", "fa-toggle-on");
    toggleIcon.classList.add("fa-solid", "fa-toggle-off");
    localStorage.removeItem("autoModalProduk");
  }
}

// simpan produk
async function simpanProduk(data) {
  const transaksi = db.transaction("produk", "readwrite");
  const store = transaksi.objectStore("produk");

  let request;

  if (idProdukEdit !== null) {
    data.id = idProdukEdit;
    request = store.put(data);
  } else {
    request = store.add(data);
    
    const tanggalHitung = localStorage.getItem("tanggalPenghitungan");
    const autoModalProduk = localStorage.getItem("autoModalProduk");
    
    if (tanggalHitung === null) {
      const sekarang = new Date();
      const tanggalLokal =
        sekarang.getFullYear() + "-" +
        String(sekarang.getMonth() + 1).padStart(2, "0") + "-" +
        String(sekarang.getDate()).padStart(2, "0");
      
      localStorage.setItem(
        "tanggalPenghitungan",
        tanggalLokal
      );
    }
    
    if (autoModalProduk && autoModalProduk === "aktif") {
      const btnAdd = document.querySelector(".btn-add");
      btnAdd.style.display = "none";
      setTimeout(() => {
        btnAdd.display = "flex";
        btnOpen.click();
      }, 2500);
    }
    
  }

  return new Promise((resolve, reject) => {

    transaksi.oncomplete = () => {
      resolve(request.result);
    };

    transaksi.onerror = () => reject(transaksi.error);
    transaksi.onabort = () => reject(transaksi.error);

  });
}

// tombol simpan produk
save.addEventListener("click", async () => {

  let kemasanvalue;
  
  if (merek.value.trim() === "") {
    merek.focus();
    return;
  }
  
   if (ukuran.value === "") {
     ukuran.focus();
     return;
   }
   
   if (harga.value === "" || Number(harga.value.replace(/\./g, "")) > 30000) {
     harga.focus();
     modalAlert("Pemberitahun", "30.000 adalah maksimal modal yang bisa dimasukkan!", "Mengerti");
     return;
   }

   if (banyak.value === "" || banyak.value === "0") {
     banyak.focus();
     return;
   }

  if (kemasan.value === "") {
    kemasanvalue = 0;
  } else {
    kemasanvalue = Number(kemasan.value.replace(/\./g, ""));
  }

  const data = {
    merek: formatTeks(merek.value.trim()),
    harga: Number(harga.value.replace(/\./g, "")),
    kemasan: kemasanvalue,
    jumlah: ubahStokKeAngka(banyak.value),
    ukuran: ukuran.value.trim()
  };

  try {

    const idBaru = await simpanProduk(data);

    if (idProdukEdit === null) {
      produkTerbaruId = idBaru;
    }

    idProdukEdit = null;

    closeModal();
    clearModal();

    await tampilkanProduk();
    await hitungTotalBeras();
    await tampilkanRincian();

  } catch (error) {
    console.error(error);
    modalAlert("Gagal", "Gagal menyimpan produk!", "Coba lagi");
  }

});

function closeModal() {
  modalProduk.classList.remove("show");
};

function clearModal() {
  merek.value = "";
  harga.value = "";
  kemasan.value = "";
  banyak.value = "";
  ukuran.value = "";
};

// bagian rincian
// membuka modal rincian
let jenisRincianAktif = "";

const modalRincian = document.querySelector("#modalRincian");
const judulRincian = document.querySelector("#judulRincian");
const namaRincian = document.querySelector("#namaRincian");
const nominalRincian = document.querySelector("#nominalRincian");

function bukaModalRincian(jenis) {

  // Reset mode edit
  idRincianEdit = null;

  jenisRincianAktif = jenis;

  namaRincian.value = "";
  nominalRincian.value = "";
  
  if (jenis === "masuk") {
    judulRincian.textContent = "Tambah Uang Masuk";
  } else if (jenis === "keluar") {
    judulRincian.textContent = "Tambah Utang / Modal";
  } else if (jenis === "pengeluaran") {
    judulRincian.textContent = "Tambah Pengeluaran";
  }

  modalRincian.classList.add("show");

  setTimeout(() => namaRincian.focus(), 300);
}

namaRincian.addEventListener("input", () => {
  namaRincian.value = formatTeks(namaRincian.value);
});
  
nominalRincian.addEventListener("input", () => {
  nominalRincian.value = formatRupiah(nominalRincian.value);
});

// tutup modal rincian
document.querySelector("#batalRincian").addEventListener("click", () => {
  modalRincian.classList.remove("show");
});

// ambil semua rincian
async function ambilSemuaRincian() {
  const transaksi = db.transaction("rincian", "readonly");
  const store = transaksi.objectStore("rincian");

  return new Promise((resolve, reject) => {
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// tampilkan rincian & hitung total
async function tampilkanRincian() {
  const data = await ambilSemuaRincian();

  const tbody = document.querySelector("#tabelRincian tbody");

  const totalBeras = Number(
    document.querySelector("#totalberas")
      .textContent.replace(/\./g, "")
  ) || 0;

  // Total uang masuk
  const totalMasuk = data
    .filter(item => item.jenis === "masuk")
    .reduce((total, item) =>
      total + Number(item.nominal || 0), 0);

  // Total utang dan modal
  const totalKeluar = data
    .filter(item => item.jenis === "keluar")
    .reduce((total, item) =>
      total + Number(item.nominal || 0), 0);

  // Total pengeluaran operasional
  const totalPengeluaran = data
    .filter(item => item.jenis === "pengeluaran")
    .reduce((total, item) =>
      total + Number(item.nominal || 0), 0);

  // Total uang ditambah kembali pengeluaran
  const totalUang =
    totalBeras + totalMasuk + totalPengeluaran;

  // Keuntungan kotor
  const untungKotor =
    totalUang - totalKeluar;

  // Keuntungan bersih
  const untungBersih =
    untungKotor - totalPengeluaran;

  const formatAngka = angka =>
    angka.toLocaleString("id-ID");

  let html = "";

  // Total beras
  html += `
    <tr class="line">
      <td>Total beras</td>
      <td class="end" id="totalberas">
        ${formatAngka(totalBeras)}
      </td>
      <td>
        <span onclick="bukaModalRincian('masuk')"
              class="btn btn-masuk">
          <i class="fa-solid fa-plus-square"></i>
        </span>
      </td>
    </tr>
  `;

  // Rincian uang masuk
  data.filter(item => item.jenis === "masuk").forEach(item => {
    html += `
      <tr>
        <td>${item.nama}</td>
        <td class="end">${formatAngka(Number(item.nominal))}</td>
        <td>
          <span onclick="editRincian(${item.id})" class="btn-edit">
            <i class="fa-solid fa-square-pen"></i>
          </span>
          <span onclick="hapusRincian(${item.id})" class="btn-hapus">
            <i class="fa-solid fa-square-xmark"></i>
          </span>
        </td>
      </tr>
    `;
  });

  let textUntung = " kotor";
  if (totalPengeluaran > 0) {
    html += `
      <tr>
        <td>Total pengeluaran</td>
        <td class="end">${formatAngka(totalPengeluaran)}</td>
        <td></td>
      </tr>
    `;
  } else {
    textUntung = " bersih";
  }

  // Total uang
  if (totalMasuk > 0) {
    html += `
      <tr class="line">
        <td>Total uang</td>
        <td class="end" id="totalUang">
          ${formatAngka(totalUang)}
        </td>
        <td>
          <span onclick="bukaModalRincian('keluar')"
                class="btn btn-keluar">
            <i class="fa-solid fa-minus-square"></i>
          </span>
        </td>
      </tr>
    `;
  

  // Rincian utang dan modal
  data.filter(item => item.jenis === "keluar").forEach(item => {
    html += `
      <tr>
        <td>${item.nama}</td>
        <td class="end">${formatAngka(Number(item.nominal))}</td>
        <td>
          <span onclick="editRincian(${item.id})" class="btn-edit">
            <i class="fa-solid fa-square-pen"></i>
          </span>
          <span onclick="hapusRincian(${item.id})" class="btn-hapus">
            <i class="fa-solid fa-square-xmark"></i>
          </span>
        </td>
      </tr>
    `;
  });

  // Untung kotor / bersih
  if (totalKeluar > 0) {
  html += `
    <tr class="line">
      <td>Untung ${textUntung}</td>
      <td class="end" id="keuntunganToko">
        ${formatAngka(untungKotor)}
      </td>
      <td>
        <span onclick="bukaModalRincian('pengeluaran')"
              class="btn btn-masuk">
          <i class="fa-solid fa-plus-square"></i>
        </span>
      </td>
    </tr>
  `;
  }

  // Total pengeluaran
  data.filter(item => item.jenis === "pengeluaran").forEach(item => {
    html += `
      <tr>
        <td>${item.nama}</td>
        <td class="end nopeng">
          ${formatAngka(Number(item.nominal))}
        </td>
        <td>
          <span onclick="editRincian(${item.id})" class="btn-edit">
            <i class="fa-solid fa-square-pen"></i>
          </span>
          <span onclick="hapusRincian(${item.id})" class="btn-hapus">
            <i class="fa-solid fa-square-xmark"></i>
          </span>
        </td>
      </tr>
    `;
  });

  // Untung bersih
  if (totalPengeluaran > 0) {
    html += `
      <tr class="line">
        <td>Untung Bersih</td>
        <td class="end" id="untungBersih">
          ${formatAngka(untungBersih)}
        </td>
        <td></td>
      </tr>
    `;
  }
    
  } // if totalMasuk

  tbody.innerHTML = html;
}

// proses edit & hapus rincian
let idRincianEdit = null;
let idRincianHapus = null;

// ambil rinciam berdasarkan id
async function ambilRincianById(id) {
  const transaksi = db.transaction("rincian", "readonly");
  const store = transaksi.objectStore("rincian");

  return new Promise((resolve, reject) => {
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// edit rincian
async function editRincian(id) {
  const data = await ambilRincianById(id);

  if (!data) return;

  idRincianEdit = data.id;
  jenisRincianAktif = data.jenis;

  namaRincian.value = data.nama;

  nominalRincian.value =
    data.nominal.toLocaleString("id-ID");

  judulRincian.textContent = "Edit Rincian";

  modalRincian.classList.add("show");
}

// simpan rincian
async function simpanRincian(data) {
  const transaksi = db.transaction("rincian", "readwrite");
  const store = transaksi.objectStore("rincian");

  if (idRincianEdit !== null) {
    data.id = idRincianEdit;
    store.put(data);
  } else {
    store.add(data);
  }

  return new Promise((resolve, reject) => {
    transaksi.oncomplete = () => resolve();
    transaksi.onerror = () => reject(transaksi.error);
    transaksi.onabort = () => reject(transaksi.error);
  });
}

// tombol simpan rinciam
document.querySelector("#simpanRincian")
  .addEventListener("click", async () => {

    const nama = namaRincian.value.trim();

    const nominal = Number(
      nominalRincian.value.replace(/\./g, "")
    );

    if (!nama || !nominalRincian.value.trim()) {
      modalAlert("Wajib isi", "Nama dan nominal harus diisi!", "Mengerti");
      return;
    }

    const data = {
      nama,
      nominal,
      jenis: jenisRincianAktif
    };

    try {
      await simpanRincian(data);

      idRincianEdit = null;

      modalRincian.classList.remove("show");

      await tampilkanRincian();

      setTimeout(() => {
        tabelRincian.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }, 250);

    } catch (error) {
      console.error(error);
      modalAlert("Gagal", "Gagal menyimpan rincian!", "Coba lagi");
    }
});

// membuka konfirmasi hapus rincian
const modalHapusRincian = document.querySelector("#modalHapusRincian");

function hapusRincian(id) {
  idRincianHapus = id;
  modalHapusRincian.classList.add("show", "max-top");
}

// tombol batal & hapus rincian
document.querySelector("#batalHapusRincian").addEventListener("click", () => {
  modalHapusRincian.classList.remove("show", "max-top");
  idRincianHapus = null;
});

// hapus rincian
async function hapusRincianDB(id) {
  const transaksi = db.transaction("rincian", "readwrite");
  transaksi.objectStore("rincian").delete(id);
  return new Promise((resolve, reject) => {
    transaksi.oncomplete = () => resolve();
    transaksi.onerror = () => reject(transaksi.error);
    transaksi.onabort = () => reject(transaksi.error);
  });
}

// tombol konfirmasi hapus rincian
document.querySelector("#konfirmasiHapusRincian")
  .addEventListener("click", async () => {

    if (idRincianHapus === null) return;

    try {
      await hapusRincianDB(idRincianHapus);

      modalHapusRincian.classList.remove("show", "maxt-top");

      idRincianHapus = null;

      await tampilkanRincian();

    } catch (error) {
      console.error(error);
      modalAlert("Gagal", "Gagal menghapus rincian!", "Coba lagi");
    }
});
// batas bagian rincian

// format teks
function formatTeks(teks) {
  return teks.replace(/\b\p{L}/gu, huruf => huruf.toUpperCase());
}

// format stok
function formatStok(angka) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 3
  }).format(angka);
}

// ubah stok ke angka
function ubahStokKeAngka(nilai) {
  return Number(
    nilai.replace(/\./g, "").replace(",", ".")
  );
}

// format input stok
function formatInputStok(input) {
  let nilai = input.value;

  // Hapus karakter selain angka dan koma
  nilai = nilai.replace(/[^\d,]/g, "");

  // Izinkan hanya satu koma
  const bagian = nilai.split(",");
  const angkaUtama = bagian[0];
  const angkaDesimal = bagian.slice(1).join("");

  // Format angka utama dengan pemisah ribuan
  const angkaFormat = angkaUtama
    ? Number(angkaUtama).toLocaleString("id-ID")
    : "";

  // Pertahankan koma ketika sedang diketik
  input.value = bagian.length > 1
    ? angkaFormat + "," + angkaDesimal
    : angkaFormat;
}

// format rupiah
function formatRupiah(angka) {
  
  let bersih = angka.replace(/\D/g, "");
  let ribuan = bersih ? Number(bersih).toLocaleString("id-ID") : "";

  return ribuan;

};

// Nonaktifkan tombol sampai database siap
save.disabled = true;

async function init() {
  try {
    await bukaDatabase();

    console.log("Database berhasil dibuka!");
    save.disabled = false;

    //await resetProduk();
    //await resetRincian();
    await tampilkanProduk();
    await hitungTotalBeras();
    await tampilkanRincian();

  } catch (error) {
    console.error("Database gagal dibuka:", error);
    modalAlert("Gagal database", "Database gagal dibuka, coba lagi dan refresh halaman!", "Mengerti");
  }
}
init();

// hitung ulang atau backup data
const modalHitungUlang = document.querySelector("#modalHitungUlang");
const modalBackupData = document.querySelector("#modalBackupData");
document.querySelector("#btnHitungUlang").addEventListener("click", () => {
  modalHitungUlang.classList.add("show", "max-top");
});
document.querySelector("#btnBackupData").addEventListener("click", () => {
  modalBackupData.classList.add("show", "max-top");
});

document.querySelector("#batalHitungUlang").addEventListener("click", () => {
  modalHitungUlang.classList.remove("show", "max-top");
});
document.querySelector("#batalBackupData").addEventListener("click", () => {
  modalBackupData.classList.remove("show", "max-top");
});

document.querySelector("#konfirmasiHitungUlang").addEventListener("click", () => {
  hitungUlang();
  modalHitungUlang.classList.remove("show", "max-top");
});
document.querySelector("#konfirmasiBackupData").addEventListener("click", () => {
  buatBackup();
  modalBackupData.classList.remove("show", "max-top");
});

// hitung ulang
// kode baru
async function hitungUlang() {
  await resetProduk();
  await resetRincian();

  localStorage.removeItem("tanggalPenghitungan");

  // Simpan tanggal penghitungan baru
  const sekarang = new Date();

  const tanggalLokal =
    sekarang.getFullYear() + "-" +
    String(sekarang.getMonth() + 1).padStart(2, "0") + "-" +
    String(sekarang.getDate()).padStart(2, "0");

  localStorage.setItem(
    "tanggalPenghitungan",
    tanggalLokal
  );

  await tampilkanProduk();
  await hitungTotalBeras();
  await tampilkanRincian();
}
/** kode lama
async function hitungUlang() {
  await resetProduk();
  await resetRincian();
  await tampilkanProduk();
  await hitungTotalBeras();
  await tampilkanRincian();
}
*/

// hapus semua produk
async function resetProduk() {

  const transaksi = db.transaction(
    "produk",
    "readwrite"
  );

  const store = transaksi.objectStore("produk");

  store.clear();

  return new Promise((resolve, reject) => {

    transaksi.oncomplete = () => {
      resolve("Semua data produk berhasil dihapus!");
    };

    transaksi.onerror = () => {
      reject(transaksi.error);
    };

  });

}

// hapus swmua rincian
async function resetRincian() {

  const transaksi = db.transaction(
    "rincian",
    "readwrite"
  );

  const store = transaksi.objectStore("rincian");

  store.clear();

  return new Promise((resolve, reject) => {

    transaksi.oncomplete = () => {
      resolve("Semua data rincian berhasil dihapus!");
    };

    transaksi.onerror = () => {
      reject(transaksi.error);
    };

  });

}



// bagian backup
// MEMBUAT FILE BACKUP
// kode baru
async function buatBackup() {

  try {

    // Ambil tanggal penghitungan
    const tanggalPenghitungan = localStorage.getItem(
      "tanggalPenghitungan"
    );

    if (!tanggalPenghitungan) {
      modalAlert("Perhatian", "Tanggal penghitungan belum tersedia, coba lagi atau klik tombol hitung ulang!", "Mengerti");
      return;
    }

    // Ambil data dari IndexedDB
    const produk = await ambilSemuaProduk();
    const rincian = await ambilSemuaRincian();

    // Tanggal backup (waktu sekarang)
    const sekarang = new Date();

    const tanggalBackup =
      sekarang.getFullYear() + "-" +
      String(sekarang.getMonth() + 1).padStart(2, "0") + "-" +
      String(sekarang.getDate()).padStart(2, "0");

    // Pecah tanggal penghitungan
    const [tahun, bulan, tanggal] =
      tanggalPenghitungan.split("-");

    const namaBulan = [
      "JANUARI", "FEBRUARI", "MARET", "APRIL",
      "MEI", "JUNI", "JULI", "AGUSTUS",
      "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"
    ];

    // Susun isi backup
    const dataBackup = {
      versi: 1,

      tanggalPenghitungan: tanggalPenghitungan,
      tanggalBackup: tanggalBackup,

      tanggal: sekarang.getDate(),
      bulan: sekarang.getMonth() + 1,
      tahun: sekarang.getFullYear(),

      produk: produk,
      rincian: rincian
    };

    // Ubah menjadi JSON
    const isiJSON = JSON.stringify(dataBackup, null, 2);

    // Buat file
    const file = new Blob(
      [isiJSON],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(file);

    // Nama file berdasarkan tanggal penghitungan
    const namaFile =
      `HB_${tanggal}_${namaBulan[Number(bulan) - 1]}_${tahun}.json`;

    // Unduh file
    const link = document.createElement("a");

    link.href = url;
    link.download = namaFile;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    modalAlert("Berhasil", "Proses backup data berhasil dibuat!", "Tutup");

  } catch (error) {

    console.error(error);
    modalAlert("Gagal", "Proses backup data gagal dibuat!", "Coba lagi");

  }

}
/** kode lama
async function buatBackup() {

  try {

    // Ambil data dari IndexedDB
    const produk = await ambilSemuaProduk();
    const rincian = await ambilSemuaRincian();

    const sekarang = new Date();

    const tanggal = sekarang.getDate();
    const bulan = [
      "JANUARI", "FEBRUARI", "MARET", "APRIL",
      "MEI", "JUNI", "JULI", "AGUSTUS",
      "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"
    ][sekarang.getMonth()];
    
    const tahun = sekarang.getFullYear();
    
    // Susun isi backup
    const dataBackup = {
      versi: 1,
      tanggalPenghitungan: sekarang.toISOString(),
      tanggalBackup: sekarang.toISOString(),

      tanggal: sekarang.getDate(),
      bulan: sekarang.getMonth() + 1,
      tahun: sekarang.getFullYear(),

      produk: produk,
      rincian: rincian
    };

    // Ubah menjadi JSON
    const isiJSON = JSON.stringify(dataBackup, null, 2);

    // Buat file
    const file = new Blob(
      [isiJSON],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(file);

    // Nama file
    const namaFile = `HB_${tanggal}_${bulan}_${tahun}.json`;

    // Unduh file
    const link = document.createElement("a");

    link.href = url;
    link.download = namaFile;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    alert("Backup berhasil dibuat!");

  } catch (error) {

    console.error(error);
    alert("Gagal membuat backup!");

  }

}
*/

menuHitung.addEventListener("click", () => {
  dropdownMenu.classList.remove("show");
  modalHitungUlang.classList.add("show", "max-top");
});

menuBackup.addEventListener("click", async () => {
  dropdownMenu.classList.remove("show");
  const produk = await ambilSemuaProduk();
  if (produk.length === 0) {
    modalAlert("Data kosong!", "Tidak ada data yang tersedia untuk diproses lebih lanjut!", "Tutup");
  } else {
    modalBackupData.classList.add("show", "max-top");
  }
});

// MEMBACA FILE BACKUP
const fileBackup = document.querySelector("#fileBackup");
const halamanBackup = document.querySelector("#halamanBackup");

let dataBackupAktif = null;

// Ketika menu Lihat Backup ditekan
menuLihatBackup.addEventListener("click", () => {
  dropdownMenu.classList.remove("show");
  fileBackup.click();
});

// Ketika pengguna memilih file JSON
fileBackup.addEventListener("change", async () => {

  const file = fileBackup.files[0];

  if (!file) return;

  try {

    // Baca isi file
    const teks = await file.text();

    // Ubah JSON menjadi object JavaScript
    const data = JSON.parse(teks);

    // Periksa struktur file backup
    if (
      data.versi !== 1 ||
      !Array.isArray(data.produk) ||
      !Array.isArray(data.rincian)
    ) {
      throw new Error("Format backup tidak sesuai!");
    }

    // Simpan data backup sementara
    dataBackupAktif = data;

    tampilkanProdukBackup(dataBackupAktif);
    tampilkanRincianBackup(dataBackupAktif);

    // Tampilkan tanggal backup
    const tanggal = new Date(data.tanggalPenghitungan);

    if (isNaN(tanggal.getTime())) {
      throw new Error("Tanggal backup tidak valid!");
    }

    document.querySelector("#tanggalBackup").textContent =
      tanggal.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      });

    document.querySelector("#bulanBackup").textContent =
      "Arsip bulan " +
      tanggal.toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric"
      });

    // Pindah ke halaman backup
    document.querySelector("body > .header").hidden = true;
    document.querySelector("body > .wrapper").hidden = true;

    halamanBackup.hidden = false;

  } catch (error) {

    console.error(error);
    modalAlert("Tidak valid", "File backup tidak valid atau rusak!", "Tutup");

  }

  // Kosongkan input agar file yang sama bisa dipilih lagi
  fileBackup.value = "";

});

// MENAMPILKAN PRODUK DARI FILE BACKUP
function tampilkanProdukBackup(data) {

  const container = document.querySelector("#tablesBackup");
  container.innerHTML = "";

  // Format angka Indonesia
  const formatAngka = new Intl.NumberFormat("id-ID");

  // Urutan ukuran
  const urutanUkuran = [
    "4 kg",
    "5 kg",
    "8 kg",
    "10 kg",
    "16 kg",
    "20 kg",
    "25 kg",
    "50 kg",
    "48 kg",
    "eceran",
    "bukaan",
    ""
  ];

  // Mengambil semua ukuran unik
  const ukuranUnik = urutanUkuran.filter(
    ukuran => data.produk.some(
      produk => produk.ukuran === ukuran
    )
  );

  ukuranUnik.forEach(ukuran => {

    // Filter produk berdasarkan ukuran
    const produkUkuran = data.produk.filter(
      produk => produk.ukuran === ukuran
    );

    // Menghitung total jumlah
    const totalJumlah = produkUkuran.reduce(
      (total, produk) => total + Number(produk.jumlah || 0),
      0
    );

    let ukuranAsli;

    if (
      ukuran === "eceran" ||
      ukuran === "bukaan" ||
      ukuran === ""
    ) {
      ukuranAsli = 1;
    } else {
      ukuranAsli = Number(parseFloat(ukuran));
    }

    // Menghitung total nilai stok
    const totalHarga = produkUkuran.reduce(
      (total, produk) =>
        total + (
          (
            (Number(produk.harga) * ukuranAsli) +
            Number(produk.kemasan || 0)
          ) * Number(produk.jumlah || 0)
        ),
      0
    );

    // Membuat tabel
    const tabBox = document.createElement("div");
    const tabTitle = document.createElement("h3");

    tabBox.classList.add("tab-box");

    const tabel = document.createElement("table");

    tabel.innerHTML = `
      <thead>
        <tr>
          <th>No</th>
          <th>Merek</th>
          <th>Byk</th>
          <th>Modal</th>
          <th>Jumlah</th>
        </tr>
      </thead>

      <tbody>
        ${produkUkuran.map((produk, i) => {

          const modal =
            (Number(produk.harga) * ukuranAsli) +
            Number(produk.kemasan || 0);

          return `
            <tr>
              <td>${i + 1}</td>
              <td class="start">${produk.merek}</td>
              <td>${formatStok(produk.jumlah)}</td>
              <td class="end">${formatAngka.format(modal)}</td>
              <td class="end">
                ${formatAngka.format(modal * Number(produk.jumlah || 0))}
              </td>
            </tr>
          `;

        }).join("")}
      </tbody>
    `;

    // Judul ukuran
    tabTitle.textContent =
      `${ukuran ? `Beras ${ukuran}` : "Salah ukuran"}`;

    let textUkuran = "";

    if (
      ukuran === "eceran" ||
      ukuran === "bukaan" ||
      ukuran === ""
    ) {
      textUkuran = " kg";
    } else {
      textUkuran = " karung";
    }

    // Footer tabel
    const tabFoot = document.createElement("div");
    tabFoot.classList.add("footer");

    const span1 = document.createElement("span");
    const span2 = document.createElement("span");
    const span3 = document.createElement("span");

    span1.textContent = "Total";
    span2.textContent =
      `${formatStok(totalJumlah)} ${textUkuran}`;
    span3.textContent =
      formatAngka.format(totalHarga);

    tabFoot.appendChild(span1);
    tabFoot.appendChild(span2);
    tabFoot.appendChild(span3);

    // Memasukkan elemen ke halaman
    tabBox.appendChild(tabTitle);
    tabBox.appendChild(tabel);
    tabBox.appendChild(tabFoot);

    container.appendChild(tabBox);

  });

}

function tampilkanRincianBackup(data) {

  const tempat = document.querySelector("#tabelRincianBackup");
  tempat.classList.add("show");

  // Mengambil data backup
  const produk = data.produk || [];
  const rincian = data.rincian || [];

  const formatAngka = angka =>
    Number(angka || 0).toLocaleString("id-ID");

  // Menghitung total beras dari produk backup
  const totalBeras = produk.reduce((total, item) => {

    let ukuran = Number.parseFloat(item.ukuran);

    if (
      item.ukuran === "eceran" ||
      item.ukuran === "bukaan" ||
      item.ukuran === "" ||
      Number.isNaN(ukuran)
    ) {
      ukuran = 1;
    }

    const harga = Number(item.harga) || 0;
    const kemasan = Number(item.kemasan) || 0;
    const jumlah = Number(item.jumlah) || 0;

    return total + ((harga * ukuran) + kemasan) * jumlah;

  }, 0);

  // Total uang masuk
  const totalMasuk = rincian
    .filter(item => item.jenis === "masuk")
    .reduce((total, item) =>
      total + (Number(item.nominal) || 0), 0);

  // Total utang dan modal
  const totalKeluar = rincian
    .filter(item => item.jenis === "keluar")
    .reduce((total, item) =>
      total + (Number(item.nominal) || 0), 0);

  // Total pengeluaran operasional
  const totalPengeluaran = rincian
    .filter(item => item.jenis === "pengeluaran")
    .reduce((total, item) =>
      total + (Number(item.nominal) || 0), 0);

  // Total uang
  const totalUang =
    totalBeras + totalMasuk + totalPengeluaran;

  // Keuntungan kotor
  const untungKotor =
    totalUang - totalKeluar;

  // Keuntungan bersih
  const untungBersih =
    untungKotor - totalPengeluaran;

  let textUntung = " kotor";

  if (totalPengeluaran === 0) {
    textUntung = " bersih";
  }

  // Membuat wadah rincian backup
  const wadah = document.createElement("div");
  wadah.id = "rincianBackup";

  const tabel = document.createElement("table");

  tabel.innerHTML = `
    <thead>
      <tr>
        <th colspan="3">Rincian keuangan</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = tabel.querySelector("tbody");

  // Fungsi membuat baris
  function tambahBaris(nama, nominal, line = false) {

    const tr = document.createElement("tr");

    if (line) {
      tr.classList.add("line");
    }

    const tdNama = document.createElement("td");
    const tdNominal = document.createElement("td");
    const tdAksi = document.createElement("td");

    tdNama.textContent = nama;
    tdNominal.textContent = formatAngka(nominal);

    tdNominal.classList.add("end");

    tr.appendChild(tdNama);
    tr.appendChild(tdNominal);
    tr.appendChild(tdAksi);

    tbody.appendChild(tr);
  }

  // Total beras
  tambahBaris("Total beras", totalBeras, true);

  // Rincian uang masuk
  rincian
    .filter(item => item.jenis === "masuk")
    .forEach(item => {
      tambahBaris(
        item.nama,
        Number(item.nominal) || 0
      );
    });

  // Total pengeluaran
  if (totalPengeluaran > 0) {
    tambahBaris("Total pengeluaran", totalPengeluaran);
  }

  // Total uang
  tambahBaris("Total uang", totalUang, true);

  // Rincian utang dan modal
  rincian
    .filter(item => item.jenis === "keluar")
    .forEach(item => {
      tambahBaris(
        item.nama,
        Number(item.nominal) || 0
      );
    });

  // Untung kotor / bersih
  tambahBaris(
    `Untung${textUntung}`,
    untungKotor,
    true
  );

  // Rincian pengeluaran operasional
  rincian
    .filter(item => item.jenis === "pengeluaran")
    .forEach(item => {
      tambahBaris(
        item.nama,
        Number(item.nominal) || 0
      );
    });

  // Untung bersih
  if (totalPengeluaran > 0) {
    tambahBaris(
      "Untung Bersih",
      untungBersih,
      true
    );
  }

  // Memasukkan elemen ke halaman
  wadah.appendChild(tabel);

  // Menghindari rincian backup tampil berulang
  const lama = tempat.querySelector("#rincianBackup");

  if (lama) {
    lama.remove();
  }

  tempat.appendChild(wadah);

}

document.querySelector("#tutupBackup").addEventListener("click", () => {
  halamanBackup.hidden = true;
  document.querySelector("body > .header").hidden = false;
  document.querySelector("body > .wrapper").hidden = false;
});
// batas bagian backup


// 1. Hubungi WhatsApp
const nomorWhatsApp = "6281285242366";

menuBantuan.addEventListener("click", () => {
  dropdownMenu.classList.remove("show");
  kirimWhatsApp();
});

function kirimWhatsApp() {

  const pesan = "Halo, saya ingin bertanya tentang aplikasi hitung barang.";

  const url =
    `https://wa.me/${nomorWhatsApp}?text=${encodeURIComponent(pesan)}`;

  window.open(url, "_blank");

}

// 2. Kirim laporan toko
menuKirimLaporan.addEventListener("click", () => {
  dropdownMenu.classList.remove("show");
  kirimLaporanWhatsApp();
});

menuDukungan.addEventListener("click", () => {
  dropdownMenu.classList.remove("show");
  window.open('https://saweria.co/siapdan', '_blank');
});

document.querySelector("#dukunganRincian button").addEventListener("click", () => {
  menuDukungan.click();
});

function ambilTeks(selector) {
  const elm = document.querySelector(selector);
  if (elm === null) {
    return "0";
  }
  return document.querySelector(selector)
    .textContent.trim().replace(/\s+/g, " ");
}

async function kirimLaporanWhatsApp() {
  
  const cekProdukAktif = await ambilSemuaProduk();
  
  if (cekProdukAktif.length === 0) {
    modalAlert("Data tidak tersedia", "Tidak ada data yang dapat diproses untuk dikirim sebagai laporan!", "Tutup");
    return;
  }

  const totalBeras = ambilTeks("#totalberas");
  const totalUang = ambilTeks("#totalUang");
  const untungKotor = ambilTeks("#keuntunganToko");
  const untungBersih = ambilTeks("#untungBersih");
  
  let totalPengeluaran = 0;

  document.querySelectorAll(".nopeng").forEach(nopeng => {
    const nominal = Number(
      nopeng.textContent.replace(/\D/g, "")
    ) || 0;

    totalPengeluaran += nominal;
  });

  const pengeluaran = new Intl.NumberFormat("id-ID")
    .format(totalPengeluaran);
    
  let rowTotalBeras = "";
  let rowTotalUang = "";
  let rowUntungKotor = "";
  let rowPengeluaran = "";
  let rowUntungBersih = "";
  
  if (totalBeras !== "0") {
    rowTotalBeras = `\nTotal Beras:   *${totalBeras}*\n`;
  }
  
  if (totalUang !== "0") {
    rowTotalUang = `Total Uang:   *${totalUang}*\n`;
  }
  
  if (untungKotor !== "0") {
    rowUntungKotor = `Untung Kotor:   *${untungKotor}*\n`;
  }
  
  if (pengeluaran !== "0") {
    rowPengeluaran = `Pengeluaran:   *${pengeluaran}*\n`;
  } else {
    if (untungKotor !== "0") {
    rowUntungKotor = `Untung Bersih:   *${untungKotor}*\n`;
    }
  }
  
  if (untungBersih !== "0") {
    rowUntungBersih = `Untung Bersih:   *${untungBersih}*\n`;
  }
  
  const pesan = [
    `*LAPORAN TOKO*\n${rowTotalBeras}${rowTotalUang}${rowUntungKotor}${rowPengeluaran}${rowUntungBersih}\nTerima kasih.`
  ];

/*
  const pesan = [
    "*LAPORAN TOKO*",
    "",
    `Total Beras :  ${totalBeras}`,
    `Total Uang :  ${totalUang}`,
    `Untung Kotor :  ${untungKotor}`,
    `Pengeluaran :  ${pengeluaran}`,
    `Untung Bersih :  ${untungBersih}`,
    "",
    "Terima kasih."
  ].join("\n");*/

  const url = `https://wa.me/?text=${encodeURIComponent(pesan)}`;

  window.open(url, "_blank");
}

const tombolMenu = document.querySelector("#tombolMenu");
const dropdownMenu = document.querySelector("#dropdownMenu");

// Buka dan tutup menu
tombolMenu.addEventListener("click", () => {
  dropdownMenu.classList.toggle("show");
});

// Klik di luar menu
document.addEventListener("click", (event) => {
  if (!event.target.closest(".menu-container")) {
    dropdownMenu.classList.remove("show");
  }
});

// Tombol Escape
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    dropdownMenu.classList.remove("show");
  }
});


document.addEventListener("focusin", (event) => {
  if (event.target.matches("input")) {
    btnOpen.style.display = "none";
  }
});
document.addEventListener("focusout", (event) => {
  if (event.target.matches("input")) {
    btnOpen.style.display = "flex";
  }
});

window.addEventListener("load", () => {
  setTimeout(() => {
    tabelRincian.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }, 500);
});

// kode baru
// Mendeteksi apakah aplikasi dibuka melalui Acode
const modePengembangan =
  location.hostname === "localhost" ||
  location.hostname === "127.0.0.1";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {

    try {

      if (modePengembangan) {

        // Matikan Service Worker saat pengembangan
        const registrasi =
          await navigator.serviceWorker.getRegistration();

        if (registrasi) {
          await registrasi.unregister();
        }

        // Hapus cache khusus HB Toko
        const daftarCache = await caches.keys();

        await Promise.all(
          daftarCache
            .filter(nama => nama.startsWith("hitung-barang-"))
            .map(nama => caches.delete(nama))
        );

        console.log("Mode pengembangan: Cache dinonaktifkan.");

        return;
      }

      // Service Worker tetap aktif di GitHub Pages
      await navigator.serviceWorker.register("./sw.js");

      console.log("Service Worker berhasil didaftarkan!");

    } catch (error) {
      console.error("Pengaturan Service Worker gagal:", error);
    }

  });
}
/** kode lama
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("./sw.js");
      console.log("Service Worker berhasil didaftarkan!");
    } catch (error) {
      console.error("Service Worker gagal:", error);
    }
  });
}
*/

// bagian instalasi aplikasi
const btnInstal = document.querySelector("#btnInstal");
const modalInstal = document.querySelector("#modalInstal");
const batalInstal = document.querySelector("#batalInstal");
const lanjutInstal = document.querySelector("#lanjutInstal");

let deferredPrompt;

// Tangkap event instalasi dari browser
window.addEventListener("beforeinstallprompt", (event) => {
  
  event.preventDefault();
  
  deferredPrompt = event;
  
  btnInstal.classList.add("show");
  
});

btnInstal.addEventListener("click", () => {
  
  if (!deferredPrompt) return;
  
  modalInstal.classList.add("show", "max-top");
  
});

batalInstal.addEventListener("click", () => {
  
  modalInstal.classList.remove("show", "max-top");
  
});

lanjutInstal.addEventListener("click", async () => {
  
  if (!deferredPrompt) return;
  
  modalInstal.classList.remove("show", "max-top");
  
  deferredPrompt.prompt();
  
  const hasil = await deferredPrompt.userChoice;
  
  console.log("Hasil instalasi:", hasil.outcome);
  
  deferredPrompt = null;
  
  btnInstal.classList.remove("show");
  
});

window.addEventListener("appinstalled", () => {
  
  btnInstal.classList.remove("show");
  
  deferredPrompt = null;
  
  console.log("Aplikasi berhasil diinstal!");
  
});

function cekStatusInstal() {
  
  const sudahTerinstal =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;
  
  if (sudahTerinstal) {
    btnInstal.classList.remove("show");
  }
  
}

cekStatusInstal();

// bagian laporkan masalah
menuLaporkan.addEventListener("click", () => {
  tampilkanModalMasalah();
});

function tampilkanModalMasalah() {
  // Cegah modal dibuat berulang
  if (document.querySelector("#modalMasalah")) return;

  const modal = document.createElement("div");
  modal.id = "modalMasalah";
  modal.className = "modal show";

  modal.innerHTML = `
    <div class="box">
      <div class="row">
        <h3>Laporkan masalah</h3>
      </div>

      <div class="row">
        <label for="judulMasalah">Judul</label>
        <input id="judulMasalah" type="text"
          placeholder="Masalah terkait">
      </div>

      <div class="row">
        <label for="pesanMasalah">Pesan</label>
        <textarea id="pesanMasalah"
          placeholder="Masalah terkait yang ingin disampaikan"></textarea>
      </div>

      <div class="row center mt-20">
        <button id="tutupModalMasalah" type="button" class="close">
          Tutup
        </button>
        <button id="kirimPesanMasalah" type="button" class="save">
          Kirim
        </button>
      </div>
    </div>
  `;

  document.body.append(modal);

  const judul = modal.querySelector("#judulMasalah");
  const pesan = modal.querySelector("#pesanMasalah");
  const tutup = modal.querySelector("#tutupModalMasalah");
  const kirim = modal.querySelector("#kirimPesanMasalah");

  // Fokus otomatis ke input judul
  judul.focus();

  // Tutup modal
  tutup.addEventListener("click", () => {
    modal.remove();
  });

  // Kirim laporan ke WhatsApp
  kirim.addEventListener("click", () => {
    const teksJudul = judul.value.trim();
    const teksPesan = pesan.value.trim();

    if (!teksJudul) {
      modalAlert("Wajib Diisi", "Judul tidak boleh kosong!", "Tutup");
      judul.focus();
      return;
    }
    
    if (!teksPesan) {
      modalAlert("Wajib Diisi", "Pesan tidak boleh kosong!", "Tutup");
      pesan.focus();
      return;
    }

    const nomorPengembang = "6281285242366";

    const isiPesan =
      `*LAPORAN MASALAH HB TOKO*\n\n` +
      `Judul: ${teksJudul}\n\n` +
      `Pesan:\n${teksPesan}`;

    const url = `https://wa.me/${nomorPengembang}?text=${encodeURIComponent(isiPesan)}`;

    window.open(url, "_blank");
    
    setTimeout(() => modal.remove(), 1000);
  });
}


// bagian dokumentasi
menuDokumentasi.addEventListener("click", () => {
  tampilkanDokumentasi();
});

function tampilkanDokumentasi() {
  // Cegah modal dibuat lebih dari satu kali
  if (document.querySelector("#modalDokumentasi")) return;

  const modal = document.createElement("div");
  modal.id = "modalDokumentasi";
  modal.className = "modal show";

  modal.innerHTML = `
    <div class="box">
      <div class="row">
        <h3>Dokumentasi</h3>
      </div>

      <div class="row auto-y">
        <p>HB Toko adalah aplikasi Hitung Barang yang dirancang untuk membantu pengguna mencatat, mengelola, dan menghitung data barang dengan mudah, praktis, dan terorganisir melalui browser maupun perangkat mobile.</p>

        <p>Aplikasi ini membantu proses pencatatan barang berdasarkan merek, ukuran, modal, kemasan, dan jumlah. Setiap data yang dimasukkan dapat dikelola sehingga pengguna lebih mudah memantau barang yang sedang dihitung.</p>

        <p>HB Toko dilengkapi dengan fitur pengelolaan data barang, penghitungan jumlah dan nilai modal, serta penyajian rincian keuangan untuk membantu pengguna mengetahui total perhitungan barang.</p>

        <p>Aplikasi juga menyediakan fitur penyimpanan dan pencadangan data agar pengguna dapat menyimpan hasil perhitungan serta membukanya kembali ketika diperlukan.</p>

        <p>Data aplikasi disimpan secara lokal pada perangkat pengguna melalui penyimpanan browser. Oleh karena itu, pengguna disarankan melakukan pencadangan data secara berkala untuk menghindari kehilangan data akibat penghapusan data browser, pergantian perangkat, atau kondisi lainnya.</p>

        <p>HB Toko juga mendukung instalasi sebagai aplikasi melalui fitur Progressive Web App (PWA), sehingga dapat ditambahkan ke layar utama perangkat dan diakses dengan lebih praktis tanpa harus selalu membuka alamat website secara manual.</p>

        <p>Untuk mendapatkan pengalaman penggunaan yang optimal, gunakan browser yang mendukung fitur penyimpanan lokal dan instalasi PWA. Pastikan juga untuk tidak menghapus data browser sebelum melakukan pencadangan.</p>

        <p>HB Toko dikembangkan untuk memberikan kemudahan dalam proses pencatatan dan perhitungan barang dengan tampilan yang sederhana, penggunaan yang praktis, serta pengelolaan data yang lebih efisien.</p>

        <p>Terima kasih telah menggunakan HB Toko. Semoga aplikasi ini dapat membantu aktivitas pencatatan dan perhitungan barang Anda.</p>
      </div>

      <div class="row center mt-20">
        <button id="tutupDokumentasi" type="button" class="close">
          Tutup
        </button>
      </div>
    </div>
  `;

  document.body.append(modal);

  // Tombol tutup
  modal.querySelector("#tutupDokumentasi").addEventListener("click", () => {
    modal.remove();
  });
}
