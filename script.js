const itemsBox = document.getElementById('items');

function addRow() {
  const row = document.createElement('div');
  row.className = 'row';
  row.innerHTML =
    '<span class="number"></span>' +
    '<input class="item-name" type="text" placeholder="اكتبي الطلب هنا">' +
    '<input class="item-quantity" type="number" min="0" step="1" placeholder="الكمية">' +
    '<input class="item-price" type="number" min="0" step="0.01" placeholder="سعر الوحدة">';

  itemsBox.appendChild(row);
  renumber();

  row.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', ensureLastRow);
  });
}

function renumber() {
  [...itemsBox.querySelectorAll('.row')].forEach((row, index) => {
    row.querySelector('.number').textContent = index + 1;
  });
}

function ensureLastRow() {
  const rows = [...itemsBox.querySelectorAll('.row')];
  const last = rows[rows.length - 1];

  const name = last.querySelector('.item-name').value.trim();
  const quantity = last.querySelector('.item-quantity').value.trim();
  const price = last.querySelector('.item-price').value.trim();

  if (name || quantity || price) {
    addRow();
  }
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[ch]));
}

document.getElementById('createButton').addEventListener('click', () => {
  const items = [...itemsBox.querySelectorAll('.row')]
    .map(row => {
      const quantityText = row.querySelector('.item-quantity').value.trim();
      const priceText = row.querySelector('.item-price').value.trim();

      return {
        name: row.querySelector('.item-name').value.trim(),
        quantity: quantityText === '' ? 1 : Number(quantityText),
        quantityText,
        price: Number(priceText) || 0,
        priceText
      };
    })
    .filter(item => item.name || item.quantityText || item.priceText);

  if (!items.length) {
    alert('اكتبي طلبًا واحدًا على الأقل.');
    return;
  }

  const total = items.reduce((sum, item) => {
    return sum + (item.quantity * item.price);
  }, 0);

  const tableRows = items.map((item, index) => {
    const itemTotal = item.quantity * item.price;

    return (
      '<tr>' +
        '<td>' + (index + 1) + '</td>' +
        '<td>' + (item.name ? escapeHtml(item.name) : '—') + '</td>' +
        '<td>' + (item.quantityText ? item.quantity : '—') + '</td>' +
        '<td>' + (item.priceText ? item.price.toFixed(2) : '—') + '</td>' +
        '<td>' + (item.priceText ? itemTotal.toFixed(2) : '—') + '</td>' +
      '</tr>'
    );
  }).join('');

  const win = window.open('', '_blank');

  if (!win) {
    alert('اسمحي بالنوافذ المنبثقة لهذا الموقع ثم اضغطي إنشاء مرة أخرى.');
    return;
  }

  win.document.open();

  win.document.write(
    '<!doctype html>' +
    '<html lang="ar" dir="rtl">' +
    '<head>' +
      '<meta charset="UTF-8">' +
      '<title>طلبات البيت</title>' +
      '<style>' +
        'body{font-family:Tahoma,Arial,sans-serif;padding:30px}' +
        'h1{text-align:center}' +
        'table{width:100%;border-collapse:collapse}' +
        'th,td{border:1px solid #999;padding:12px;text-align:right}' +
        '.total{margin-top:20px;padding:12px;border:1px solid #999;font-size:20px;font-weight:bold}' +
      '</style>' +
    '</head>' +
    '<body>' +
      '<h1>قائمة طلبات البيت</h1>' +
      '<p>التاريخ: ' + new Date().toLocaleDateString('ar-EG') + '</p>' +
      '<table>' +
        '<thead><tr>' +
          '<th>رقم</th>' +
          '<th>الطلب</th>' +
          '<th>الكمية</th>' +
          '<th>سعر الوحدة</th>' +
          '<th>إجمالي الطلب</th>' +
        '</tr></thead>' +
        '<tbody>' + tableRows + '</tbody>' +
      '</table>' +
      '<div class="total">الإجمالي الكلي: ' + total.toFixed(2) + '</div>' +
    '</body>' +
    '</html>'
  );

  win.document.close();

  setTimeout(() => {
    win.focus();
    win.print();
  }, 500);
});

for (let i = 0; i < 5; i++) {
  addRow();
}
