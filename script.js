import { initializeApp }        from 'https://www.gstatic.com/firebasejs/9.20.0/firebase-app.js';
import { getAnalytics }         from 'https://www.gstatic.com/firebasejs/9.20.0/firebase-analytics.js';
import {
  getDatabase,
  ref,
  onValue,
  push,
  remove
} from 'https://www.gstatic.com/firebasejs/9.20.0/firebase-database.js';

// → Replace with your Firebase config ↓
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

// Initialize Firebase
const app       = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db        = getDatabase(app);

// Fields under each node
const fieldsMap = {
  ewes:     ["id","status","medDate","expenses","sellDate","sellPrice"],
  rams:     ["id","purchaseDate","purchasePrice","status","expenses","sellDate","sellPrice"],
  lambs:    ["id","purchaseDate","purchasePrice","medDate","expenses","sellDate","sellPrice"],
  chickens: ["type","gender","count","purchaseDate","purchasePrice","medDate","expenses","sellDate","sellPrice"],
  olives:   ["count","plantDate","medDate","harvestDate","medCosts"]
};

// Arabic header labels for cards
const headerLabelsMap = {
  ewes:     ["رقم","الوضعيّة","تاريخ دواء","مصاريف","تاريخ بيع","ثمن بيع"],
  rams:     ["رقم","تاريخ شراء","ثمن شراء","الوضعيّة","مصاريف","تاريخ / ثمن بيع"],
  lambs:    ["رقم","تاريخ شراء","ثمن شراء","تاريخ دواء","مصاريف","تاريخ / ثمن بيع"],
  chickens: ["نوع","جنس","عدد","تاريخ شراء","ثمن شراء","تاريخ دواء","مصاريف","تاريخ بيع","ثمن بيع"],
  olives:   ["عدد","تاريخ زرع","تاريخ دواء","تاريخ قطاف","مصاريف دواء"]
};

let selectedFarm = null;

window.addEventListener("DOMContentLoaded", () => {
  const sections   = Object.keys(fieldsMap);
  const farmSelect = document.getElementById("farm-select");
  const nav        = document.querySelector("nav");
  const switchBtn  = document.getElementById("switch-farm");

  // hide nav + sections on load
  nav.classList.remove("visible");
  sections.forEach(id => document.getElementById(id).classList.remove("active"));

  // pick a farm
  document.querySelectorAll(".farm-card").forEach(card => {
    card.addEventListener("click", () => {
      selectedFarm = card.dataset.farm;    // “sefrou” or “kamouni”
      farmSelect.style.display = "none";
      nav.classList.add("visible");
      initDataListeners();
      document.querySelector('nav a[data-section="ewes"]').click();
    });
  });

  // switch farm
  switchBtn.addEventListener("click", e => {
    e.preventDefault();
    selectedFarm = null;
    farmSelect.style.display = "flex";
    nav.classList.remove("visible");
    sections.forEach(id => document.getElementById(id).classList.remove("active"));
    document.querySelectorAll("nav a").forEach(a => a.classList.remove("active"));
  });

  // show/hide sections
  document.querySelectorAll("nav a[data-section]").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const sec = link.dataset.section;
      document.querySelectorAll("nav a").forEach(a => a.classList.remove("active"));
      link.classList.add("active");
      sections.forEach(id => {
        document.getElementById(id).classList.toggle("active", id === sec);
      });
    });
  });

  // wire up Firebase per section
  function initDataListeners() {
    sections.forEach(sec => {
      const nodeRef = ref(db, `${selectedFarm}/${sec}`);
      const tbody   = document.querySelector(`#${sec}-table`);
      const form    = document.querySelector(`#${sec}-form`);
      const fields  = fieldsMap[sec];

      onValue(nodeRef, snap => {
        tbody.innerHTML = "";
        snap.forEach(child => {
          const data = child.val(), key = child.key;
          const tr   = document.createElement("tr");

          fields.forEach((f, i) => {
            const td = document.createElement("td");
            td.setAttribute("data-label", headerLabelsMap[sec][i] || "");
            if ((sec === "rams"||sec==="lambs") && f==="sellDate") {
              td.textContent = `${data.sellDate||""} / ${data.sellPrice||""}`;
            } else {
              td.textContent = data[f] || "";
            }
            tr.appendChild(td);
          });

          // delete button cell
          const delTd = document.createElement("td");
          delTd.setAttribute("data-label", "");
          const btn = document.createElement("button");
          btn.textContent = "حذف";
          btn.addEventListener("click", () => {
            remove(ref(db, `${selectedFarm}/${sec}/${key}`));
          });
          delTd.appendChild(btn);
          tr.appendChild(delTd);

          tbody.appendChild(tr);
        });
      });

      // add new
      form.addEventListener("submit", e => {
        e.preventDefault();
        const payload = {};
        fields.forEach(f => payload[f] = form[f].value);
        push(ref(db, `${selectedFarm}/${sec}`), payload);
        form.reset();
      });
    });
  }
});

