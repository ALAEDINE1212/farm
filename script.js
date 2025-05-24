import { initializeApp }        from 'https://www.gstatic.com/firebasejs/9.20.0/firebase-app.js';
import { getAnalytics }         from 'https://www.gstatic.com/firebasejs/9.20.0/firebase-analytics.js';
import {
  getDatabase,
  ref,
  onValue,
  push,
  update,
  remove
} from 'https://www.gstatic.com/firebasejs/9.20.0/firebase-database.js';

// ← your Firebase config ↓
const firebaseConfig = {
  apiKey: "AIzaSyBgxLUjJQKbMh9xTBbnqOUitVuJaOo72ro",
  authDomain: "farm-b8de3.firebaseapp.com",
  databaseURL: "https://farm-b8de3-default-rtdb.firebaseio.com",
  projectId: "farm-b8de3",
  storageBucket: "farm-b8de3.appspot.com",
  messagingSenderId: "1026170713438",
  appId: "1:1026170713438:web:b9269ae28a4b8042160bcf",
  measurementId: "G-EJJ5B4T1L6"
};
const app       = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db        = getDatabase(app);

// section → field keys
const sectionsMap = {
  ewes:      ["id","status","medDate","expenses","sellDate","sellPrice"],
  rams:      ["id","purchaseDate","purchasePrice","status","expenses","sellDate","sellPrice"],
  lambs:     ["id","purchaseDate","purchasePrice","medDate","expenses","sellDate","sellPrice"],
  chickens:  ["type","gender","count","purchaseDate","purchasePrice","medDate","expenses","sellDate","sellPrice"],
  olives:    ["count","plantDate","medDate","harvestDate","medCosts"],
  cowFemales:["id","status","medDate","expenses","sellDate","sellPrice"],
  cowMales:  ["id","purchaseDate","purchasePrice","status","expenses","sellDate","sellPrice"]
};

// overview columns [label, key]
const overviewMap = {
  ewes:      [["رقم","id"],["مصاريف","expenses"],["ثمن بيع","sellPrice"]],
  rams:      [["رقم","id"],["مصاريف","expenses"],["ثمن بيع","sellPrice"]],
  lambs:     [["رقم","id"],["مصاريف","expenses"],["ثمن بيع","sellPrice"]],
  chickens:  [["نوع","type"],["مصاريف","expenses"],["ثمن بيع","sellPrice"]],
  olives:    [["عدد","count"],["مصاريف دواء","medCosts"],["تاريخ قطاف","harvestDate"]],
  cowFemales:[["رقم","id"],["مصاريف","expenses"],["ثمن بيع","sellPrice"]],
  cowMales:  [["رقم","id"],["مصاريف","expenses"],["ثمن بيع","sellPrice"]]
};

// fully Arabic field labels for modal
const fieldLabelMap = {
  id:            "رقم",
  status:        "الوضعيّة",
  medDate:       "تاريخ الدواء",
  purchaseDate:  "تاريخ الشراء",
  purchasePrice: "ثمن الشراء",
  expenses:      "مصاريف",
  sellDate:      "تاريخ البيع",
  sellPrice:     "ثمن البيع",
  count:         "عدد",
  type:          "نوع",
  gender:        "جنس",
  plantDate:     "تاريخ الزرع",
  harvestDate:   "تاريخ القطاف",
  medCosts:      "مصاريف دواء"
};

let selectedFarm = null,
    currentList  = null,
    currentKey   = null;

window.addEventListener("DOMContentLoaded", () => {
  const farmSelect = document.getElementById("farm-select");
  const sidebar    = document.getElementById("sidebar");
  const switchBtn  = document.getElementById("switch-farm");
  const modal      = document.getElementById("detail-modal");
  const modalForm  = document.getElementById("detail-form");
  const modalTitle = document.getElementById("detail-title");
  const closeBtn   = document.getElementById("detail-close");

  // 1) pick farm
  document.querySelectorAll(".farm-card").forEach(c => {
    c.addEventListener("click", () => {
      selectedFarm = c.dataset.farm;
      farmSelect.style.display = "none";
      sidebar.style.display    = "block";
      initListeners();
    });
  });

  // 2) switch farm
  switchBtn.addEventListener("click", e => {
    e.preventDefault();
    selectedFarm = null;
    farmSelect.style.display = "flex";
    sidebar.style.display    = "none";
    document.querySelectorAll(".section").forEach(s => s.style.display = "none");
    document.querySelectorAll("#sidebar a").forEach(a => a.classList.remove("active"));
  });

  // 3) toggle sections
  document.querySelectorAll("#sidebar a[data-section]").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      currentList = link.dataset.section;
      document.querySelectorAll("#sidebar a").forEach(a => a.classList.remove("active"));
      link.classList.add("active");
      document.querySelectorAll(".section").forEach(s => s.style.display = "none");
      document.getElementById(currentList).style.display = "block";
    });
  });

  // 4) modal close
  closeBtn.addEventListener("click", () => modal.classList.add("hidden"));

  // initialize listeners for each section
  function initListeners() {
    Object.keys(sectionsMap).forEach(sec => {
      const fields   = sectionsMap[sec];
      const overview = document.getElementById(`${sec}-overview`);
      const form     = document.getElementById(`${sec}-form`);
      const dbRef    = ref(db, `${selectedFarm}/${sec}`);

      onValue(dbRef, snap => {
        overview.innerHTML = "";

        // build overview items
        snap.forEach(child => {
          const data = child.val(), key = child.key;
          const item = document.createElement("div");
          item.classList.add("overview-item");
          overviewMap[sec].forEach(([_, f]) => {
            const d = document.createElement("div");
            d.textContent = data[f] || "";
            item.appendChild(d);
          });
          item.addEventListener("click", () => openModal(sec, key, data));
          overview.appendChild(item);
        });

        // compute & show total expenses
        let total = 0;
        snap.forEach(ch => {
          const num = parseFloat(ch.val().expenses);
          if (!isNaN(num)) total += num;
        });
        let totalDiv = overview.parentElement.querySelector(".overview-total");
        if (!totalDiv) {
          totalDiv = document.createElement("div");
          totalDiv.classList.add("overview-total");
          overview.parentElement.appendChild(totalDiv);
        }
        totalDiv.textContent = `مجموع المصاريف: ${total}`;
      });

      // add new record
      form.addEventListener("submit", e => {
        e.preventDefault();
        const payload = {};
        fields.forEach(f => payload[f] = form[f].value);
        push(dbRef, payload);
        form.reset();
      });
    });
  }

  // open & build modal for details/edit
  function openModal(sec, key, data) {
    currentKey = key;
    modalTitle.textContent = `تفاصيل ${fieldLabelMap[sectionsMap[sec][0]] || sec}`;
    modalForm.innerHTML = "";

    sectionsMap[sec].forEach(f => {
      const lbl = document.createElement("label");
      lbl.textContent = fieldLabelMap[f] || f;
      const inp = document.createElement("input");
      inp.name  = f;
      inp.value = data[f] || "";
      if (f.toLowerCase().includes("date")) inp.type = "date";
      modalForm.appendChild(lbl);
      modalForm.appendChild(inp);
    });

    const save = document.createElement("button");
    save.textContent = "تحديث";
    save.addEventListener("click", e => {
      e.preventDefault();
      const updates = {};
      Array.from(modalForm.elements)
        .filter(el => el.name)
        .forEach(el => updates[el.name] = el.value);
      update(ref(db, `${selectedFarm}/${currentList}/${currentKey}`), updates);
      modal.classList.add("hidden");
    });

    const del = document.createElement("button");
    del.textContent = "حذف نهائي";
    del.style.background = "#c62828";
    del.addEventListener("click", e => {
      e.preventDefault();
      remove(ref(db, `${selectedFarm}/${currentList}/${currentKey}`));
      modal.classList.add("hidden");
    });

    modalForm.appendChild(save);
    modalForm.appendChild(del);
    modal.classList.remove("hidden");
  }
});
