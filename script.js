// 1) import the modular SDK
import { initializeApp }        from 'https://www.gstatic.com/firebasejs/9.20.0/firebase-app.js';
import { getAnalytics }         from 'https://www.gstatic.com/firebasejs/9.20.0/firebase-analytics.js';
import {
  getDatabase,
  ref,
  onValue,
  push
} from 'https://www.gstatic.com/firebasejs/9.20.0/firebase-database.js';

// 2) your Firebase config (replace with yours)
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

// 3) initialize
const app   = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db    = getDatabase(app);

// 4) map each section → its fields
const fieldsMap = {
  ewes:     ["id","status","medDate","expenses","sellDate","sellPrice"],
  rams:     ["id","purchaseDate","purchasePrice","status","expenses","sellDate","sellPrice"],
  lambs:    ["id","purchaseDate","purchasePrice","medDate","expenses","sellDate","sellPrice"],
  chickens: ["type","gender","count","purchaseDate","purchasePrice","medDate","expenses","sellDate","sellPrice"],
  olives:   ["count","plantDate","medDate","harvestDate","medCosts"]
};

// 5) on DOM ready
window.addEventListener("DOMContentLoaded", () => {
  const sections = Object.keys(fieldsMap);

  // hide all
  sections.forEach(id => document.getElementById(id).style.display = 'none');

  // nav click → show + animate
  document.querySelectorAll("nav a").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const sec = link.dataset.section;
      // clear active
      document.querySelectorAll("nav a").forEach(a => a.classList.remove("active"));
      link.classList.add("active");
      // hide others
      sections.forEach(id => {
        const el = document.getElementById(id);
        el.classList.remove("fade-in");
        el.style.display = id===sec? 'block':'none';
        if (id===sec) el.classList.add("fade-in");
      });
    });
  });

  // wire up Firebase for each section
  sections.forEach(sec => {
    const dbRef = ref(db, sec);
    const tbody = document.querySelector(`#${sec}-table tbody`);
    const form  = document.querySelector(`#${sec}-form`);
    const fields= fieldsMap[sec];

    // render on update
    onValue(dbRef, snap => {
      tbody.innerHTML = '';
      snap.forEach(child => {
        const data = child.val();
        const tr = document.createElement('tr');

        fields.forEach(f => {
          const td = document.createElement('td');
          // combine sellDate+sellPrice for rams & lambs
          if ((sec==='rams'||sec==='lambs') && f==='sellDate') {
            td.textContent = `${data.sellDate||''} / ${data.sellPrice||''}`;
          } else {
            td.textContent = data[f] || '';
          }
          tr.appendChild(td);
        });

        tbody.appendChild(tr);
      });
    });

    // add new on submit
    form.addEventListener('submit', e => {
      e.preventDefault();
      const payload = {};
      fields.forEach(f => payload[f] = form[f].value);
      push(dbRef, payload);
      form.reset();
    });
  });
});
