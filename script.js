const itemsBox = document.getElementById('items');

function addRow() {
  const row = document.createElement('div');
  row.className = 'row';
  row.innerHTML = '<span class="number"></span><input class="item-name" type="text" placeholder="اكتبي الطلب هنا"><input class="item-price" type="number" min="0" step="0.01" placeholder="السعر">';
  itemsBox.appendChild(row);
  renumber();
  row.querySelectorAll('input').forEach(input => input.addEventListener('input', ensureLastRow));
}

function renumber() {
  [...itemsBox.querySelectorAll('.row')].forEach((row, index) => {
    row.querySelector('.number').textContent = index + 1;
  });
}

function ensureLastRow() {
  const rows = [...itemsBox.querySelectorAll('.row')];
  const last = rows[rows.length - 1];
  if (last.querySelector('.item-name').value.trim() || last.querySelector('.item-price').value.trim()) addRow();
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

document.getElementById('createButton').addEventListener('click', () => {
  const items = [...itemsBox.querySelectorAll('.row')].map(row => ({
    name: row.querySelector('.item-name').value.trim(),
    priceText: row.querySelector('.item-price').value.trim(),
    price: Number(row.querySelector('.item-price').value) || 0
  })).filter(item => item.name || item.priceText);

  if (!items.length) {
    alert('اكتبي طلبًا واحدًا على الأقل.');
    return;
  }

  const total = items.reduce((sum, item) => sum + item.price, 0);
  const tableRows = items.map((item, index) =>
    '<tr><td>' + (index + 1) + '</td><td>' + (item.name ? escapeHtml(item.name) : '—') + '</td><td>' + (item.priceText ? item.price.toFixed(2) : '—') + '</td></tr>'
  ).join('');

  const win = window.open('', '_blank');
  if (!win) {
    alert('اسمحي بالنوافذ المنبثقة لهذا الموقع ثم اضغطي إنشاء مرة أخرى.');
    return;
  }

  win.document.open();
  win.document.write('<!doctype html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>طلبات البيت</title><style>body{font-family:Tahoma,Arial,sans-serif;padding:30px}h1{text-align:center}table{width:100%;border-collapse:collapse}th,td{border:1px solid #999;padding:12px;text-align:right}.total{margin-top:20px;padding:12px;border:1px solid #999;font-size:20px;font-weight:bold}</style></head><body><h1>قائمة طلبات البيت</h1><p>التاريخ: ' + new Date().toLocaleDateString('ar-EG') + '</p><table><thead><tr><th>رقم</th><th>الطلب</th><th>السعر</th></tr></thead><tbody>' + tableRows + '</tbody></table><div class="total">الإجمالي: ' + total.toFixed(2) + '</div></body></html>');
  win.document.close();
  setTimeout(() => { win.focus(); win.print(); }, 500);
});

for (let i = 0; i < 5; i++) addRow();
