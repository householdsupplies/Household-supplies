
(function () {
  const style = document.createElement("div");

  style.innerHTML = `
    <button id="hs-chat-button" type="button"
      aria-expanded="false" aria-controls="hs-chat-panel">
      💬 اسأل عن المنتجات
    </button>

    <section id="hs-chat-panel" aria-label="مساعد طلبات البيت"
      aria-hidden="true">
      <div class="hs-chat-header">
        <strong>مساعد طلبات البيت</strong>
        <button id="hs-chat-close" type="button"
          aria-label="إغلاق الدردشة">×</button>
      </div>

      <div id="hs-chat-messages" aria-live="polite"></div>

      <form id="hs-chat-form" class="hs-chat-form">
        <input id="hs-chat-input" type="text"
          placeholder="اكتب اسم المنتج..."
          aria-label="اكتب سؤالك" maxlength="150" required>
        <button type="submit">إرسال</button>
      </form>
    </section>
  `;

  document.body.appendChild(style);

  const toggle = document.getElementById("hs-chat-button");
  const panel = document.getElementById("hs-chat-panel");
  const close = document.getElementById("hs-chat-close");
  const messages = document.getElementById("hs-chat-messages");
  const form = document.getElementById("hs-chat-form");
  const input = document.getElementById("hs-chat-input");

  let products = [];
  let pricesLoaded = false;

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFKC")
      .replace(/[\u064B-\u065F\u0670]/g, "")
      .replace(/[أإآٱ]/g, "ا")
      .replace(/ى/g, "ي")
      .replace(/ة/g, "ه")
      .replace(/[ـ]/g, "")
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .trim();
  }

  function addMessage(text, type) {
    const message = document.createElement("div");
    message.className = "hs-message hs-" + type;
    message.textContent = text;
    messages.appendChild(message);
    messages.scrollTop = messages.scrollHeight;
    return message;
  }

  function showProducts(list) {
    const message = document.createElement("div");
    message.className = "hs-message hs-bot";

    message.textContent = list.length
      ? "لقيت المنتجات دي في قائمة الأسعار:"
      : "ملقيتش منتج مطابق. جرّب كلمة أقصر، زي أرز أو مكرونة.";

    if (list.length) {
      list.slice(0, 6).forEach(product => {
        const card = document.createElement("div");
        card.className = "hs-product";

        const name = document.createElement("strong");
        name.textContent = product.name;

        const price = document.createElement("span");
        price.textContent =
          Number(product.price).toFixed(2) + " جنيه";

        const add = document.createElement("button");
        add.type = "button";
        add.textContent = "أضف لقائمة الطلبات";

        add.addEventListener("click", () => {
          if (typeof window.addRow !== "function") {
            addMessage(
              "تعذر الوصول لقائمة الطلبات. حدّث الصفحة وجرب تاني.",
              "bot"
            );
            return;
          }

          const rows = [
            ...document.querySelectorAll("#items .row")
          ];

          let row = rows.find(item =>
            !item.querySelector(".item-name").value.trim() &&
            !item.querySelector(".item-quantity").value.trim() &&
            !item.querySelector(".item-price").value.trim()
          );

          if (!row) {
            window.addRow();
            row = document.querySelector("#items .row:last-child");
          }

          if (!row) return;

          row.querySelector(".item-name").value = product.name;
          row.querySelector(".item-quantity").value = "1";
          row.querySelector(".item-price").value = product.price;

          row.querySelectorAll("input").forEach(field => {
            field.dispatchEvent(new Event("input", {
              bubbles: true
            }));
          });

          add.disabled = true;
          add.textContent = "تمت الإضافة ✓";
        });

        card.append(name, price, add);
        message.appendChild(card);
      });
    }

    messages.appendChild(message);
    messages.scrollTop = messages.scrollHeight;
  }

  function answer(question) {
    const q = normalize(question);

    if (!q) {
      addMessage("اكتب اسم المنتج اللي بتدور عليه.", "bot");
      return;
    }

    if (/^(السلام عليكم|سلام|اهلا|اهلين|مرحبا|هاي|hi|hello)$/.test(q)) {
      addMessage(
        "أهلًا بيك في طلبات البيت! 👋 اسألني عن منتج أو سعره.",
        "bot"
      );
      return;
    }

    if (/^(شكرا|شكرا جدا|متشكر|تسلم)$/.test(q)) {
      addMessage("العفو، تحت أمرك! 😊", "bot");
      return;
    }

    if (/^(مساعده|مساعدة|بتعمل ايه|ازاي استخدم الموقع)$/.test(q)) {
      addMessage(
        "اكتب اسم المنتج أو كلمة منه عشان أبحث في الأسعار. " +
        "تقدر كمان تضغط «أضف لقائمة الطلبات» لإضافته للقائمة الحالية.",
        "bot"
      );
      return;
    }

    if (!pricesLoaded) {
      addMessage(
        "قائمة الأسعار لسه ما اتحملتش. جرّب تحديث الصفحة بعد قليل.",
        "bot"
      );
      return;
    }

    const words = q.split(/\s+/).filter(word => word.length > 1);

    const matches = products
      .map(product => ({
        product,
        name: normalize(product.name)
      }))
      .filter(item => {
        return item.name.includes(q) ||
          (words.length > 0 &&
           words.every(word => item.name.includes(word)));
      })
      .sort((a, b) => {
        const aExact = a.name === q ? 1 : 0;
        const bExact = b.name === q ? 1 : 0;
        return bExact - aExact;
      })
      .map(item => item.product);

    showProducts(matches);
  }

  function openChat() {
    panel.classList.add("hs-open");
    panel.setAttribute("aria-hidden", "false");
    toggle.setAttribute("aria-expanded", "true");
    input.focus();
  }

  function closeChat() {
    panel.classList.remove("hs-open");
    panel.setAttribute("aria-hidden", "true");
    toggle.setAttribute("aria-expanded", "false");
    toggle.focus();
  }

  toggle.addEventListener("click", () => {
    if (panel.classList.contains("hs-open")) {
      closeChat();
    } else {
      openChat();
    }
  });

  close.addEventListener("click", closeChat);

  form.addEventListener("submit", event => {
    event.preventDefault();

    const question = input.value.trim();
    if (!question) return;

    addMessage(question, "user");
    input.value = "";
    answer(question);
  });

  addMessage(
    "أهلًا بيك! 👋 اكتب اسم المنتج، زي أرز أو مكرونة، " +
    "وهساعدك تلاقي سعره من القائمة الموجودة.",
    "bot"
  );

  fetch("./prices.json", { cache: "no-store" })
    .then(response => {
      if (!response.ok) throw new Error("تعذر تحميل الأسعار");
      return response.json();
    })
    .then(data => {
      if (!Array.isArray(data)) {
        throw new Error("صيغة ملف الأسعار غير صحيحة");
      }

      products = data.filter(product =>
        product &&
        typeof product.name === "string" &&
        product.name.trim() &&
        Number.isFinite(Number(product.price)) &&
        product.price !== ""
      );

      pricesLoaded = true;
    })
    .catch(error => {
      console.error("مساعد طلبات البيت:", error);
      addMessage(
        "مش قادر أوصل لملف الأسعار حاليًا. " +
        "تأكد إن prices.json موجود في مجلد الموقع.",
        "bot"
      );
    });
})();
