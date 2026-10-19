
(() => {
  "use strict";

  const VISITOR_KEY = "household-visitor-name";
  const WELCOMED_KEY = "household-visitor-welcomed";

  const $ = (id) => document.getElementById(id);

  function initChatbot() {
    const chatToggle = $("chatToggle");
    const chatPanel = $("chatPanel");
    const chatClose = $("chatClose");
    const chatForm = $("chatForm");
    const chatInput = $("chatInput");
    const chatMessages = $("chatMessages");

    const welcomeBar = $("welcomeBar");
    const welcomeModal = $("welcomeModal");
    const welcomeForm = $("welcomeForm");
    const visitorNameInput = $("visitorName");
    const skipWelcome = $("skipWelcome");

    // لو عناصر الدردشة مش موجودة، ما نلمسش باقي الموقع.
    if (
      !chatToggle ||
      !chatPanel ||
      !chatForm ||
      !chatInput ||
      !chatMessages
    ) {
      return;
    }

    let products = [];
    let productsLoaded = false;

    function getVisitorName() {
      try {
        return localStorage.getItem(VISITOR_KEY) || "";
      } catch {
        return "";
      }
    }

    function showWelcomeBar(name) {
      if (!welcomeBar) return;

      welcomeBar.textContent = name
        ? `أهلًا يا ${name} 👋 نورت طلبات البيت!`
        : "أهلًا بيك 👋 نورت طلبات البيت!";

      welcomeBar.hidden = false;
    }

    function closeWelcomeModal() {
      if (welcomeModal) welcomeModal.hidden = true;
    }

    function saveVisitorName(name) {
      const cleanName = String(name || "").trim().slice(0, 40);

      try {
        if (cleanName) {
          localStorage.setItem(VISITOR_KEY, cleanName);
        }

        localStorage.setItem(WELCOMED_KEY, "yes");
      } catch {
        // يظل الموقع قابلًا للاستخدام حتى لو التخزين غير متاح.
      }

      showWelcomeBar(cleanName || getVisitorName());
      closeWelcomeModal();
    }

    // الترحيب بالزائر أول مرة على نفس المتصفح والجهاز.
    try {
      const savedName = getVisitorName();
      const alreadyWelcomed =
        localStorage.getItem(WELCOMED_KEY) === "yes";

      if (savedName || alreadyWelcomed) {
        showWelcomeBar(savedName);
        closeWelcomeModal();
      } else if (welcomeModal) {
        welcomeModal.hidden = false;
      }
    } catch {
      closeWelcomeModal();
    }

    if (welcomeForm) {
      welcomeForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const name = visitorNameInput
          ? visitorNameInput.value
          : "";

        saveVisitorName(name);
      });
    }

    if (skipWelcome) {
      skipWelcome.addEventListener("click", () => {
        saveVisitorName("");
      });
    }

    // فتح وإغلاق نافذة الدردشة.
    function setChatOpen(open) {
      chatPanel.hidden = !open;
      chatToggle.setAttribute("aria-expanded", String(open));

      if (open) {
        chatInput.focus();
      }
    }

    chatToggle.addEventListener("click", () => {
      setChatOpen(chatPanel.hidden);
    });

    if (chatClose) {
      chatClose.addEventListener("click", () => {
        setChatOpen(false);
      });
    }

    function addMessage(message, type) {
      const bubble = document.createElement("div");
      bubble.className =
        "chat-message " +
        (type === "user" ? "user-message" : "bot-message");

      // نستخدم textContent لتجنب إدخال HTML من رسائل المستخدم.
      bubble.textContent = message;
      chatMessages.appendChild(bubble);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function normalize(text) {
      return String(text || "")
        .toLowerCase()
        .replace(/[أإآ]/g, "ا")
        .replace(/ة/g, "ه")
        .replace(/ى/g, "ي")
        .replace(/[ًٌٍَُِّْـ]/g, "")
        .trim();
    }

    async function loadProducts() {
      if (productsLoaded) return products;

      productsLoaded = true;

      try {
        const response = await fetch("./prices.json", {
          cache: "no-store"
        });

        if (!response.ok) {
          throw new Error("تعذر تحميل ملف الأسعار");
        }

        const data = await response.json();

        // يدعم ملف JSON الذي يحتوي على مصفوفة مباشرة
        // أو كائن بداخله products أو items.
        if (Array.isArray(data)) {
          products = data;
        } else if (Array.isArray(data.products)) {
          products = data.products;
        } else if (Array.isArray(data.items)) {
          products = data.items;
        } else {
          products = [];
        }
      } catch (error) {
        console.warn("Chatbot: لم يتم تحميل الأسعار.", error);
        products = [];
      }

      return products;
    }

    function getProductName(product) {
      return String(
        product.name ??
        product.product ??
        product.title ??
        product.item ??
        ""
      );
    }

    function getProductPrice(product) {
      return (
        product.price ??
        product.priceEGP ??
        product.amount ??
        null
      );
    }

    async function searchPrice(message) {
      const list = await loadProducts();
      const query = normalize(message);

      const matches = list.filter((product) => {
        const name = normalize(getProductName(product));
        return name && (
          query.includes(name) ||
          name.includes(query)
        );
      });

      if (!matches.length) return null;

      const product = matches.sort((a, b) => {
        return getProductName(b).length - getProductName(a).length;
      })[0];

      const name = getProductName(product);
      const price = getProductPrice(product);

      if (price === null || price === undefined || price === "") {
        return `لقيت المنتج "${name}" في القائمة، لكن السعر مش متوفر في البيانات.`;
      }

      return `🛒 ${name}\n💰 السعر المسجل: ${price} جنيه.\n\nخلي بالك: ده السعر الموجود في ملف الموقع، ومش بالضرورة يكون سعر كارفور الحالي.`;
    }

    async function getReply(message) {
      const text = normalize(message);

      if (!text) {
        return "اكتب سؤالك وأنا هحاول أساعدك 😊";
      }

      if (
        text.includes("السلام عليكم") ||
        text.includes("اهلا") ||
        text.includes("ازيك") ||
        text.includes("مرحبا") ||
        text.includes("صباح الخير") ||
        text.includes("مساء الخير")
      ) {
        const name = getVisitorName();
        return name
          ? `أهلًا يا ${name} 😊 أقدر أساعدك في البحث عن الأسعار أو استخدام الموقع.`
          : "أهلًا بيك 😊 أقدر أساعدك في البحث عن الأسعار أو استخدام الموقع.";
      }

      if (
        text.includes("شكرا") ||
        text.includes("متشكر") ||
        text.includes("تسلم")
      ) {
        return "العفو 😊 أنا موجود لو احتجت أي مساعدة.";
      }

      if (
        text.includes("سعر") ||
        text.includes("بكام") ||
        text.includes("ثمن") ||
        text.includes("تكلفه")
      ) {
        const priceReply = await searchPrice(message);

        if (priceReply) return priceReply;

        return "مش لاقي المنتج في ملف الأسعار الحالي. جرّب تكتب اسم المنتج زي ما هو مسجل في قائمة الموقع.";
      }

      if (
        text.includes("pdf") ||
        text.includes("بي دي اف") ||
        text.includes("ملف") ||
        text.includes("اطبع")
      ) {
        return "لإنشاء ملف PDF، استخدم زر إنشاء أو الطباعة الموجود في الموقع. لو ظهر ملف فاضي أو حصل خطأ، ما تمسحش بياناتك؛ ابعتلي كود index.html وscript.js عشان نراجع وظيفة الإنشاء من غير ما نغيّر باقي الموقع.";
      }

      if (
        text.includes("شارك") ||
        text.includes("واتساب") ||
        text.includes("مشاركه")
      ) {
        return "استخدم زر المشاركة الموجود في الموقع. وظيفة المشاركة نفسها موجودة في script.js، وأنا مش بغيّرها من كود الدردشة ده.";
      }

      if (
        text.includes("حفظ") ||
        text.includes("بتتخزن") ||
        text.includes("الطلبات")
      ) {
        return "الموقع بيستخدم التخزين المحلي في المتصفح لحفظ الطلبات على نفس الجهاز والمتصفح. مسح بيانات المتصفح ممكن يمسح البيانات المحفوظة.";
      }

      if (
        text.includes("ليلي") ||
        text.includes("الوضع الليلي") ||
        text.includes("الظلام")
      ) {
        return "تقدر تستخدم زر الوضع الليلي الموجود أعلى الموقع لتغيير المظهر.";
      }

      if (
        text.includes("كارفور") ||
        text.includes("الاسعار") ||
        text.includes("الأسعار")
      ) {
        return "أقدر أبحث في الأسعار الموجودة في ملف prices.json فقط. الأسعار دي مش تحديث مباشر من كارفور، فلازم تتراجع قبل الشراء.";
      }

      const priceReply = await searchPrice(message);
      if (priceReply) return priceReply;

      return "أقدر أساعدك في البحث عن منتج داخل قائمة الأسعار، أو أوضح لك استخدام الموقع. جرّب مثلًا: سعر السكر، إزاي أحفظ الطلبات، أو إزاي أشارك الطلب.";
    }

    chatForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const message = chatInput.value.trim();
      if (!message) return;

      addMessage(message, "user");
      chatInput.value = "";
      chatInput.disabled = true;

      try {
        const reply = await getReply(message);
        addMessage(reply, "bot");
      } catch (error) {
        console.error("Chatbot error:", error);
        addMessage(
          "حصلت مشكلة بسيطة. جرّب تاني بعد شوية.",
          "bot"
        );
      } finally {
        chatInput.disabled = false;
        chatInput.focus();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initChatbot);
  } else {
    initChatbot();
  }
})();
