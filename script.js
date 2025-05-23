import { initializeApp }    from 'https://www.gstatic.com/firebasejs/9.20.0/firebase-app.js';
import { getAnalytics }     from 'https://www.gstatic.com/firebasejs/9.20.0/firebase-analytics.js';
import {
  getDatabase,
  ref,
  onValue,
  push
} from 'https://www.gstatic.com/firebasejs/9.20.0/firebase-database.js';

// ← Replace with your Firebase config ↓
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

// fields under each node
const fieldsMap = {
  ewes:     ["id","status","medDate","expenses","sellDate","sellPrice"],
  rams:     ["id","purchaseDate","purchasePrice","status","expenses","sellDate","sellPrice"],
  lambs:    ["id","purchaseDate","purchasePrice","medDate","expenses","sellDate","sellPrice"],
  chickens: ["type","gender","count","purchaseDate","purchasePrice","medDate","expenses","sellDate","sellPrice"],
  olives:   ["count","plantDate","medDate","harvestDate","medCosts"]
};

window.addEventListener("DOMContentLoaded", () => {
  const sections = Object.keys(fieldsMap);

  // hide all
  sections.forEach(id => document.getElementById(id).classList.remove("active"));

  // nav click toggles sections
  document.querySelectorAll("nav a").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const sec = link.dataset.section;
      document.querySelectorAll("nav a").forEach(a => a.classList.remove("active"));
      link.classList.add("active");
      sections.forEach(id => {
        const el = document.getElementById(id);
        el.classList.toggle("active", id === sec);
      });
    });
  });

  // wire up Firebase listeners & forms
  sections.forEach(sec => {
    const dbRef = ref(db, sec);
    const tbody = document.querySelector(`#${sec}-table`);
    const form  = document.querySelector(`#${sec}-form`);
    const fields= fieldsMap[sec];

    // render on update
    onValue(dbRef, snap => {
      tbody.innerHTML = "";
      snap.forEach(child => {
        const data = child.val();
        const tr = document.createElement("tr");
        fields.forEach(f => {
          const td = document.createElement("td");
          // combine date/price for rams & lambs
          if ((sec === "rams" || sec === "lambs") && f === "sellDate") {
            td.textContent = `${data.sellDate||""} / ${data.sellPrice||""}`;
          } else {
            td.textContent = data[f] || "";
          }
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
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
});
