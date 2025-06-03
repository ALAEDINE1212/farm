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

// ← بيانات Firebase الخاصة بك ↓
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

const sectionsMap = {
  ewes:      ["id","status","purchasePrice","medDate","expenses","sellDate","sellPrice"],
  rams:      ["id","purchaseDate","purchasePrice","status","expenses","sellDate","sellPrice"],
  lambs:     ["id","purchaseDate","purchasePrice","medDate","expenses","sellDate","sellPrice"],
  chickens:  ["type","gender","count","purchaseDate","purchasePrice","medDate","expenses","sellDate","sellPrice"],
  olives:    ["count","plantDate","medDate","harvestDate","medCosts"],
  cowFemales:["id","status","purchasePrice","medDate","expenses","sellDate","sellPrice"],
  cowMales:  ["id","purchaseDate","purchasePrice","status","expenses","sellDate","sellPrice"]
};

const overviewMap = {
  ewes:      [["رقم","id"],["مصاريف","expenses"],["ثمن بيع","sellPrice"]],
  rams:      [["رقم","id"],["مصاريف","expenses"],["ثمن بيع","sellPrice"]],
  lambs:     [["رقم","id"],["مصاريف","expenses"],["ثمن بيع","sellPrice"]],
  chickens:  [["نوع","type"],["مصاريف","expenses"],["ثمن بيع","sellPrice"]],
  olives:    [["عدد","count"],["مصاريف دواء","medCosts"],["تاريخ القطاف","harvestDate"]],
  cowFemales:[["رقم","id"],["مصاريف","expenses"],["ثمن بيع","sellPrice"]],
  cowMales:  [["رقم","id"],["مصاريف","expenses"],["ثمن بيع","sellPrice"]]
};

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
  const farmSelect  = document.getElementById("farm-select");
  const sidebar     = document.getElementById("sidebar");
  const switchBtn   = document.getElementById("switch-farm");
  const menuToggle  = document.getElementById("menu-toggle");
  const menuClose   = document.getElementById("menu-close");
  const overlay     = document.getElementById("overlay");
  const modal       = document.getElementById("detail-modal");
  const modalForm   = document.getElementById("detail-form");
  const modalTitle  = document.getElementById("detail-title");
  const closeBtn    = document.getElementById("detail-close");

  // ضبط العنصر input[type="date"] لكل نموذج
  document.querySelectorAll(".item-form input[type='date']").forEach(inp => {
    const label = fieldLabelMap[inp.name] || "";
    inp.setAttribute("aria-label", label);
    inp.setAttribute("title", label);
    inp.placeholder = label;
  });

  // 1) عند اختيار المزرعة:
  document.querySelectorAll(".farm-card").forEach(c => {
    c.addEventListener("click", () => {
      selectedFarm = c.dataset.farm;
      farmSelect.style.display = "none";

      // نظهر زرّ ☰ في أعلى اليمين (menu-toggle) ونفعّل الشريط الجانبي ليكون مخفيًّا (transform: translateX(100%))
      menuToggle.style.display = "block";
      sidebar.classList.remove("open");
      overlay.style.display = "none";

      initListeners();
    });
  });

  // 2) عند الضغط على زرّ “☰” (menu-toggle):
  //    نظهر الشريط الجانبي (نضيف الصنف open) ونبيّن طبقة الظلّ (overlay)
  menuToggle.addEventListener("click", () => {
    sidebar.classList.add("open");
    overlay.style.display = "block";
  });

  // 3) عند الضغط على زرّ “×” داخل الشريط الجانبي:
  menuClose.addEventListener("click", () => {
    sidebar.classList.remove("open");
    overlay.style.display = "none";
  });

  // 4) عند الضغط على طبقة الظل (overlay)، نُغلق الشريط الجانبي
  overlay.addEventListener("click", () => {
    sidebar.classList.remove("open");
    overlay.style.display = "none";
  });

  // 5) الضغط على رابط قسم داخل الشريط الجانبي:
  document.querySelectorAll("#sidebar a[data-section]").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      currentList = link.dataset.section;

      // تمييز الرابط النشط
      document.querySelectorAll("#sidebar a").forEach(a => a.classList.remove("active"));
      link.classList.add("active");

      // إخفاء جميع الأقسام وإظهار القسم المختار
      document.querySelectorAll(".section").forEach(s => s.style.display = "none");
      document.getElementById(currentList).style.display = "block";

      // إخفاء نموذج القسم تلقائيًّا
      const body = document.getElementById(currentList).querySelector(".section-body");
      if (body) body.style.display = "none";

      // نُغلق الشريط الجانبي ونُخفي الظلّ
      sidebar.classList.remove("open");
      overlay.style.display = "none";
    });
  });

  // 6) الضغط على “تغيير المزرعة”:
  switchBtn.addEventListener("click", e => {
    e.preventDefault();
    selectedFarm = null;
    farmSelect.style.display = "flex";

    // نُعيد إخفاء الشريط الجانبي والظلّ وزرّ ☰
    sidebar.classList.remove("open");
    overlay.style.display = "none";
    menuToggle.style.display = "none";

    document.querySelectorAll(".section").forEach(s => s.style.display = "none");
    document.querySelectorAll("#sidebar a").forEach(a => a.classList.remove("active"));
  });

  // 7) تهيئة الاستماع (CRUD) بعد اختيار المزرعة
  function initListeners() {
    Object.keys(sectionsMap).forEach(sec => {
      const fields   = sectionsMap[sec];
      const overview = document.getElementById(`${sec}-overview`);
      const form     = document.getElementById(`${sec}-form`);
      const dbRef    = ref(db, `${selectedFarm}/${sec}`);

      // الاستماع لتغيرات Firebase
      onValue(dbRef, snap => {
        overview.innerHTML = "";

        let totalExpenses = 0;
        let totalPurchase = 0;
        let totalSell     = 0;

        snap.forEach(child => {
          const key  = child.key;
          const data = child.val();

          // إنشاء صفّ جديد في قائمة العرض
          const row  = document.createElement("div");
          row.classList.add("overview-item");
          overview.appendChild(row);

          // إدراج الأعمدة الثلاث حسب overviewMap
          overviewMap[sec].forEach(([colName, colKey]) => {
            const cell = document.createElement("div");
            cell.textContent = data[colKey] || "";
            row.appendChild(cell);

            if (colKey === "expenses") {
              const num = parseFloat(data[colKey]);
              if (!isNaN(num)) totalExpenses += num;
            }
            if (colKey === "sellPrice") {
              const num = parseFloat(data[colKey]);
              if (!isNaN(num)) totalSell += num;
            }
          });

          const buyVal = parseFloat(data.purchasePrice);
          if (!isNaN(buyVal)) totalPurchase += buyVal;

          // عند الضغط على الصفّ، نفتح نافذة التعديل/الحذف
          row.addEventListener("click", () => {
            modalTitle.textContent = sec + " - " + (data.id || data.type || data.count);
            modalForm.innerHTML = "";
            currentKey = key;

            fields.forEach(field => {
              const div = document.createElement("div");
              div.classList.add("field-group");
              const lbl = document.createElement("label");
              lbl.setAttribute("for", `detail-${field}`);
              lbl.textContent = fieldLabelMap[field] || field;
              const inp = document.createElement("input");
              inp.id   = `detail-${field}`;
              inp.name = field;
              if (field.includes("Date")) inp.type = "date";
              inp.value = data[field] || "";
              div.appendChild(lbl);
              div.appendChild(inp);
              modalForm.appendChild(div);
            });

            // زر التعديل
            const updateBtn = document.createElement("button");
            updateBtn.textContent = "تعديل";
            updateBtn.type = "button";
            updateBtn.addEventListener("click", () => {
              const updates = {};
              fields.forEach(field => {
                const val = modalForm.querySelector(`[name="${field}"]`).value.trim();
                updates[field] = val;
              });
              update(ref(db, `${selectedFarm}/${sec}/${currentKey}`), updates);
              modal.classList.add("hidden");
            });

            // زر الحذف
            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "حذف";
            deleteBtn.type = "button";
            deleteBtn.style.marginLeft = "1rem";
            deleteBtn.addEventListener("click", () => {
              remove(ref(db, `${selectedFarm}/${sec}/${currentKey}`));
              modal.classList.add("hidden");
            });

            modalForm.appendChild(updateBtn);
            modalForm.appendChild(deleteBtn);
            modal.classList.remove("hidden");
          });
        });

        // إضافة صفوف الإحصائيات في الأسفل
        const totalCostRow = document.createElement("div");
        totalCostRow.classList.add("overview-total");
        totalCostRow.textContent = `مجموع المصاريف: ${totalExpenses || 0}`;
        overview.appendChild(totalCostRow);

        const totalPurchaseRow = document.createElement("div");
        totalPurchaseRow.classList.add("overview-total");
        totalPurchaseRow.textContent = `مجموع الشراء: ${totalPurchase || 0}`;
        overview.appendChild(totalPurchaseRow);

        const totalSellRow = document.createElement("div");
        totalSellRow.classList.add("overview-total");
        totalSellRow.textContent = `مجموع البيع: ${totalSell || 0}`;
        overview.appendChild(totalSellRow);

        const netRow = document.createElement("div");
        netRow.classList.add("overview-total");
        const netVal = (totalSell || 0) - ((totalPurchase || 0) + (totalExpenses || 0));
        netRow.textContent = `الربح/الخسارة: ${netVal}`;
        overview.appendChild(netRow);
      });

      // التعامل مع نماذج الإضافة
      form.addEventListener("submit", e => {
        e.preventDefault();
        const obj = {};
        fields.forEach(field => {
          const value = form.querySelector(`[name="${field}"]`).value.trim();
          obj[field] = value;
        });
        push(dbRef, obj);
        form.reset();
      });
    });

    // 8) زرّ إظهار/إخفاء نموذج القسم (section-body)
    document.querySelectorAll(".section-toggle").forEach(btn => {
      btn.addEventListener("click", () => {
        const body = btn.nextElementSibling;
        if (body.style.display === "block") {
          body.style.display = "none";
        } else {
          body.style.display = "block";
        }
      });
    });

    // 9) زرّ إغلاق النافذة المنبثقة
    closeBtn.addEventListener("click", () => {
      modal.classList.add("hidden");
    });
  }
});
