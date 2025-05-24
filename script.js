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
  apiKey: "AIzaSyBgx...",
  authDomain: "farm-b8de3.firebaseapp.com",
  databaseURL: "https://farm-b8de3-default-rtdb.firebaseio.com",
  projectId: "farm-b8de3",
  storageBucket: "farm-b8de3.appspot.com",
  messagingSenderId: "1026170713438",
  appId: "1:1026170713438:web:...",
  measurementId: "G-EJJ5B4T1L6"
};

// init
const app       = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db        = getDatabase(app);

// all sections & their fields
const sectionsMap = {
  ewes:      ["id","status","medDate","expenses","sellDate","sellPrice"],
  rams:      ["id","purchaseDate","purchasePrice","status","expenses","sellDate","sellPrice"],
  lambs:     ["id","purchaseDate","purchasePrice","medDate","expenses","sellDate","sellPrice"],
  chickens:  ["type","gender","count","purchaseDate","purchasePrice","medDate","expenses","sellDate","sellPrice"],
  olives:    ["count","plantDate","medDate","harvestDate","medCosts"],
  cowFemales:["id","status","medDate","expenses","sellDate","sellPrice"],
  cowMales:  ["id","purchaseDate","purchasePrice","status","expenses","sellDate","sellPrice"]
};
// overview columns: [label, fieldKey]
const overviewMap = {
  ewes:      [["رقم","id"],["مصاريف","expenses"],["ثمن بيع","sellPrice"]],
  rams:      [["رقم","id"],["مصاريف","expenses"],["ثمن بيع","sellPrice"]],
  lambs:     [["رقم","id"],["مصاريف","expenses"],["ثمن بيع","sellPrice"]],
  chickens:  [["نوع","type"],["مصاريف","expenses"],["ثمن بيع","sellPrice"]],
  olives:    [["عدد","count"],["مصاريف","medCosts"],["ثمن بيع",""]],
  cowFemales:[["رقم","id"],["مصاريف","expenses"],["ثمن بيع","sellPrice"]],
  cowMales:  [["رقم","id"],["مصاريف","expenses"],["ثمن بيع","sellPrice"]]
};

let selectedFarm = null;
let currentList  = null;
let currentKey   = null;

window.addEventListener("DOMContentLoaded", () => {
  const farmSelect = document.getElementById("farm-select");
  const sidebar    = document.getElementById("sidebar");
  const main       = document.getElementById("main-content");
  const switchBtn  = document.getElementById("switch-farm");
  const modal      = document.getElementById("detail-modal");
  const modalForm  = document.getElementById("detail-form");
  const modalTitle = document.getElementById("detail-title");
  const closeBtn   = document.getElementById("detail-close");

  // pick farm
  document.querySelectorAll(".farm-card").forEach(c => {
    c.addEventListener("click", () => {
      selectedFarm = c.dataset.farm;
      farmSelect.style.display = "none";
      sidebar.style.display    = "block";
      initListeners();
    });
  });
  // switch farm
  switchBtn.addEventListener("click", e => {
    e.preventDefault();
    selectedFarm = null;
    farmSelect.style.display = "flex";
    sidebar.style.display    = "none";
    document.querySelectorAll(".section").forEach(s => s.style.display = "none");
  });

  // toggle sections
  document.querySelectorAll("#sidebar a[data-section]").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      currentList = link.dataset.section;
      document.querySelectorAll("#sidebar a").forEach(a=>a.classList.remove("active"));
      link.classList.add("active");
      document.querySelectorAll(".section").forEach(s=>s.style.display="none");
      document.getElementById(currentList).style.display="block";
    });
  });

  // modal close
  closeBtn.addEventListener("click", () => modal.classList.add("hidden"));

  function initListeners() {
    Object.keys(sectionsMap).forEach(sec => {
      const fields   = sectionsMap[sec];
      const overview = document.getElementById(`${sec}-overview`);
      const form     = document.getElementById(`${sec}-form`);
      const dbRef    = ref(db, `${selectedFarm}/${sec}`);

      // on value
      onValue(dbRef, snap => {
        overview.innerHTML = "";
        snap.forEach(child => {
          const data = child.val(), key = child.key;
          // build overview card
          const item = document.createElement("div");
          item.classList.add("overview-item");
          overviewMap[sec].forEach(([_,f])=>{
            const div = document.createElement("div");
            div.textContent = data[f]||"";
            item.appendChild(div);
          });
          // click to open modal
          item.addEventListener("click", () => {
            openModal(sec, key, data);
          });
          overview.appendChild(item);
        });
      });

      // add new
      form.addEventListener("submit", e => {
        e.preventDefault();
        const payload = {};
        fields.forEach(f => payload[f] = form[f].value);
        push(dbRef, payload);
        form.reset();
      });
    });
  }

  function openModal(sec, key, data) {
    currentKey = key;
    modalTitle.textContent = `تفاصيل ${sec}`;
    modalForm.innerHTML = "";
    // build form fields
    sectionsMap[sec].forEach(f => {
      const lbl = document.createElement("label");
      lbl.textContent = f;
      const inp = document.createElement("input");
      inp.name = f;
      inp.value = data[f]||"";
      if (f.toLowerCase().includes("date")) inp.type = "date";
      modalForm.appendChild(lbl);
      modalForm.appendChild(inp);
    });
    // Save button
    const saveBtn = document.createElement("button");
    saveBtn.textContent = "تحديث";
    saveBtn.addEventListener("click", e => {
      e.preventDefault();
      const updates = {};
      Array.from(modalForm.elements)
        .filter(el=>el.name)
        .forEach(el=> updates[el.name] = el.value);
      update(ref(db, `${selectedFarm}/${currentList}/${currentKey}`), updates);
      modal.classList.add("hidden");
    });
    // Delete button
    const delBtn = document.createElement("button");
    delBtn.textContent = "حذف نهائي";
    delBtn.style.background = "#c62828";
    delBtn.addEventListener("click", e=>{
      e.preventDefault();
      remove(ref(db, `${selectedFarm}/${currentList}/${currentKey}`));
      modal.classList.add("hidden");
    });
    modalForm.appendChild(saveBtn);
    modalForm.appendChild(delBtn);

    modal.classList.remove("hidden");
  }
});

