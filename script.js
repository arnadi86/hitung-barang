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
    tabelRincian.classList.remove("show")
  } else {
    tabelRincian.classList.add("show");
  }

}

// edit produk
let idProdukEdit = null;

async function editProduk(id) {
  const produk = await ambilProdukById(id);

  if (!produk) {
    alert("Produk tidak ditemukan!");
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
  modalHapus.classList.add("show");
}

// tutup modal hapus
function tutupModalHapus() {
  modalHapus.classList.remove("show");
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
    alert("Gagal menghapus produk!");
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
console.log("data: ", data)
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
  //console.log("totalberas: ", totalBeras)
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
  if (event.key === "Enter") { alert()
  event.preventDefault();
  harga.focus();
  }
});

btnOpen.addEventListener("click", () => {
  modalProduk.classList.add("show");
  setTimeout(() => {
    merek.focus();
  }, 350);


  let kemasanProduk = localStorage.getItem("kemasanProduk");
  let ukuranProduk = localStorage.getItem("ukuranProduk");

  if (ukuranProduk) {
    kemasan.value = formatStok(kemasanProduk);
    ukuran.value = ukuranProduk;
  } else {
    kemasan.value = formatStok(3000);
    ukuran.value = "5 kg";
  }
});


let setKemasan= null;
let setUkuran = "";
ukuran.addEventListener("change", () => {
  localStorage.removeItem("ukuranProduk");
  
  let valUkuran = ukuran.value;
  
  if (valUkuran === "4 kg") {
    kemasan.value = formatStok(2500);
    setKemasan = 2500;
    setUkuran = "4 kg";
  }
  
  if (valUkuran === "5 kg") {
    kemasan.value = formatStok(3000);
    setKemasan = 3000;
    setUkuran = "5 kg";
  }
  
  if (valUkuran === "8 kg") {
    kemasan.value = formatStok(3000);
    setKemasan = 3000;
    setUkuran = "8 kg";
  }
  
  if (valUkuran === "10 kg") {
    kemasan.value = formatStok(3000);
    setKemasan = 3000;
    setUkuran = "10 kg";
  }
  
  if (valUkuran === "16 kg") {
    kemasan.value = formatStok(4000);
    setKemasan = 4000;
    setUkuran = "16 kg";
  }
  
  if (valUkuran === "20 kg") {
    kemasan.value = formatStok(4000);
    setKemasan = 4000;
    setUkuran = "20 kg";
  }
  
  if (valUkuran === "25 kg") {
    kemasan.value = formatStok(4000);
    setKemasan = 4000;
    setUkuran = "25 kg";
  }
  
  if (valUkuran === "48 kg") {
    kemasan.value = "";
    setKemasan = null
    setUkuran = "48 kg";
  }
  if (valUkuran === "50 kg") {
    kemasan.value = "";
    setKemasan = null
    setUkuran = "50 kg";
  }
  
  if (valUkuran === "eceran") {
    kemasan.value = "";
    setKemasan = null
    setUkuran = "eceran";
  }
  
  if (valUkuran === "bukaan") {
    kemasan.value = "";
    setKemasan = null
    setUkuran = "bukaan";
  }

  setTimeout(() => harga.focus(), 300);

  localStorage.setItem("kemasanProduk", setKemasan);
  localStorage.setItem("ukuranProduk", setUkuran);
});



close.addEventListener("click", () => {
  closeModal();
  clearModal();
});

clear.addEventListener("click", () => {
  merek.focus();
  clearModal();
});

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

  if (kemasan.value.trim() === "") {
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
    alert("Gagal menyimpan produk!");
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
// mwmbuka modal rincian
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
  data.filter(item => item.jenis === "masuk")
    .forEach(item => {
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

  // Rincian pengeluaran (ditampilkan sebelum total uang)
  data.filter(item => item.jenis === "pengeluaran").forEach(item => {
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

  // Untung kotor
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

  // Total pengeluaran
  data.filter(item => item.jenis === "pengeluaran").forEach(item => {
    html += `
      <tr>
        <td>${item.nama}</td>
        <td class="end">
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
      alert("Nama dan nominal harus diisi!");
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

    } catch (error) {
      console.error(error);
      alert("Gagal menyimpan rincian!");
    }
});

// membuka konfirmasi hapus rincian
const modalHapusRincian =
  document.querySelector("#modalHapusRincian");

function hapusRincian(id) {
  idRincianHapus = id;

  modalHapusRincian.classList.add("show");
}

// tombol batal & hapus rincian
document.querySelector("#batalHapusRincian")
  .addEventListener("click", () => {

    modalHapusRincian.classList.remove("show");

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

      modalHapusRincian.classList.remove("show");

      idRincianHapus = null;

      await tampilkanRincian();

    } catch (error) {
      console.error(error);
      alert("Gagal menghapus rincian!");
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
    alert("Database gagal dibuka!");
  }
}
init();

// hitung ulang atau backup data
const modalHitungUlang = document.querySelector("#modalHitungUlang");
const modalBackupData = document.querySelector("#modalBackupData");
document.querySelector("#btnHitungUlang").addEventListener("click", () => {
  modalHitungUlang.classList.add("show");
});
document.querySelector("#btnBackupData").addEventListener("click", () => {
  modalBackupData.classList.add("show");
});

document.querySelector("#batalHitungUlang").addEventListener("click", () => {
  modalHitungUlang.classList.remove("show");
});
document.querySelector("#batalBackupData").addEventListener("click", () => {
  modalBackupData.classList.remove("show");
});

document.querySelector("#konfirmasiHitungUlang").addEventListener("click", () => {
  hitungUlang();
  modalHitungUlang.classList.remove("show");
});
document.querySelector("#konfirmasiBackupData").addEventListener("click", () => {
  hitungUlangBackup();
  modalBackupData.classList.remove("show");
});

// hitung ulang
async function hitungUlang() {
  await resetProduk();
  await resetRincian();
  await tampilkanProduk();
  await hitungTotalBeras();
  await tampilkanRincian();
}

// hitung ulang + backup data
async function hitungUlangBackup() {
  buatBackup();
  setTimeout(() => hitungUlang(), 1000);
}

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
async function buatBackup() {

  try {

    // Ambil data dari IndexedDB
    const produk = await ambilSemuaProduk();
    const rincian = await ambilSemuaRincian();

    const sekarang = new Date();

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
    const namaFile =
      `Backup_HitungBarang_${sekarang.getDate()}-${sekarang.getMonth() + 1}-${sekarang.getFullYear()}.json`;

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


document.querySelector('[data-menu="backup"]')
  .addEventListener("click", () => {

    dropdownMenu.classList.remove("show");

    //buatBackup();
    modalBackupData.classList.add("show");

  });


// MEMBACA FILE BACKUP

const fileBackup = document.querySelector("#fileBackup");
const halamanBackup = document.querySelector("#halamanBackup");

let dataBackupAktif = null;

// Ketika menu Lihat Backup ditekan
document.querySelector('[data-menu="lihatBackup"]')
  .addEventListener("click", () => {

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
    alert("File backup tidak valid atau rusak: " + error.message);

  }

  // Kosongkan input agar file yang sama bisa dipilih lagi
  fileBackup.value = "";

});


// MENAMPILKAN PRODUK DARI FILE BACKUP

function tampilkanProdukBackup(data) {

  const tempat = document.querySelector("#tablesBackup");

  tempat.innerHTML = "";

  // Format angka
  const formatUangBackup = angka => {
    return new Intl.NumberFormat("id-ID").format(
      Number(angka) || 0
    );
  };

  // Kelompokkan produk berdasarkan ukuran
  const kelompok = {};

  data.produk.forEach(item => {

    const ukuran = item.ukuran || "Lainnya";

    if (!kelompok[ukuran]) {
      kelompok[ukuran] = [];
    }

    kelompok[ukuran].push(item);

  });

  // Buat tabel untuk setiap ukuran
  Object.entries(kelompok).forEach(([ukuran, produk]) => {

    let totalKarung = 0;
    let totalModal = 0;

    const bagian = document.createElement("div");

    // Judul tabel
    const judul = document.createElement("h3");
    judul.textContent = `BERAS ${ukuran}`;

    bagian.appendChild(judul);

    // Buat tabel
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
      <tbody></tbody>
      <tfoot>
        <tr>
          <th colspan="2">Total</th>
          <th class="totalBackupKarung"></th>
          <th></th>
          <th class="totalBackupModal"></th>
        </tr>
      </tfoot>
    `;

    const tbody = tabel.querySelector("tbody");

    produk.forEach((item, index) => {

      const banyak = Number(item.jumlah) || 0;
      const modal = Number(item.harga) || 0;
      const jumlah = banyak * modal;

      totalKarung += banyak;
      totalModal += jumlah;

      const baris = document.createElement("tr");

      const kolom = [
        index + 1,
        item.merek,
        banyak,
        formatUangBackup(modal),
        formatUangBackup(jumlah)
      ];

      kolom.forEach(nilai => {
        const td = document.createElement("td");
        td.textContent = nilai;
        baris.appendChild(td);
      });

      tbody.appendChild(baris);

    });

    tabel.querySelector(".totalBackupKarung").textContent =
      totalKarung;

    tabel.querySelector(".totalBackupModal").textContent =
      formatUangBackup(totalModal);

    bagian.appendChild(tabel);
    tempat.appendChild(bagian);

  });

}

function tampilkanRincianBackup(data) {

  const tempat = document.querySelector("#tablesBackup");

  // Judul rincian
  const judul = document.createElement("h3");
  judul.textContent = "RINCIAN KEUANGAN";

  tempat.appendChild(judul);

  // Buat tabel
  const tabel = document.createElement("table");

  tabel.innerHTML = `
    <thead>
      <tr>
        <th>No</th>
        <th>Nama</th>
        <th>Jenis</th>
        <th>Nominal</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = tabel.querySelector("tbody");

  let totalMasuk = 0;
  let totalKeluar = 0;

  data.rincian.forEach((item, index) => {

    const nominal = Number(item.nominal) || 0;

    if (item.jenis === "masuk") {
      totalMasuk += nominal;
    }

    if (item.jenis === "keluar") {
      totalKeluar += nominal;
    }

    const tr = document.createElement("tr");

    const isi = [
      index + 1,
      item.nama,
      item.jenis === "masuk" ? "Masuk" : "Keluar",
      new Intl.NumberFormat("id-ID").format(nominal)
    ];

    isi.forEach(nilai => {
      const td = document.createElement("td");
      td.textContent = nilai;
      tr.appendChild(td);
    });

    tbody.appendChild(tr);

  });

  tempat.appendChild(tabel);

}


document.querySelector("#tutupBackup")
  .addEventListener("click", () => {

    halamanBackup.hidden = true;

    document.querySelector("body > .header").hidden = false;
    document.querySelector("body > .wrapper").hidden = false;

  });
// batas bagian backup








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
    document.querySelector("#tabelRincian")
      .scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
  }, 500);
});




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
