(async function () {
  let products = [];

  try {
    const response = await fetch("./prices.json", { cache: "no-store" });
    if (!response.ok) throw new Error("ملف الأسعار غير موجود");
    products = await response.json();
  } catch (error) {
    console.log("الأسعار لم تُربط بعد.");
    return;
  }

  const list = document.createElement("datalist");
  list.id = "knownProducts";

  products.forEach(product => {
    if (!product.name) return;

    const option = document.createElement("option");
    option.value = product.name;
    option.label = `${product.price} جنيه`;
    list.appendChild(option);
  });

  document.body.appendChild(list);

  document.addEventListener("focusin", event => {
    if (event.target.matches(".item-name")) {
      event.target.setAttribute("list", "knownProducts");
    }
  });

  document.addEventListener("input", event => {
    if (!event.target.matches(".item-name")) return;

    const row = event.target.closest(".row");
    const name = event.target.value.trim().toLowerCase();

    const product = products.find(item =>
      item.name.trim().toLowerCase() === name
    );

    if (!row || !product) return;

    const priceInput = row.querySelector(".item-price");
    if (priceInput) priceInput.value = product.price;
  });
})();
