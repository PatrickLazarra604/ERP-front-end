const money = n => '₱' + Number(n).toLocaleString('en-PH');

const getCart = () => JSON.parse(localStorage.getItem('ttcart') || '[]');

function save(c) { localStorage.setItem('ttcart', JSON.stringify(c)); count() }

function count() { let e = document.getElementById('cartCount'); if (e) e.textContent = getCart().reduce((a, x) => a + x.qty, 0) }

function add(id) { let c = getCart(), x = c.find(x => x.id === id); x ? x.qty++ : c.push({ id, qty: 1 }); save(c); alert('Added to cart!') }
function card(p) { return `<article class="product"><div class="icon">${p.icon}</div><small>${p.category}</small><h3>${p.name}</h3><strong>${money(p.price)}</strong><p class="${p.stock <= 5 ? 'low' : ''}">${p.stock} in stock</p><button class="btn full" onclick="add(${p.id})">Bili Na / Add to Cart</button></article>` }
function render(id, list) { document.getElementById(id).innerHTML = list.map(card).join(''); count() }
function setupProducts() { let q = new URLSearchParams(location.search).get('cat'); if (q) cat.value = q; function go() { render('list', products.filter(p => (!cat.value || p.category === cat.value) && p.name.toLowerCase().includes(search.value.toLowerCase()))) } search.oninput = go; cat.onchange = go; go() }
function renderCart() { let c = getCart(), e = document.getElementById('cart'); if (!c.length) { e.innerHTML = '<div class="card"><h2>Cart is empty 🛒</h2><a class="btn" href="products.html">Browse Products</a></div>'; return } let total = 0; e.innerHTML = c.map(x => { let p = products.find(p => p.id === x.id), s = p.price * x.qty; total += s; return `<div class="row"><span>${p.icon} ${p.name} × ${x.qty}</span><b>${money(s)}</b></div>` }).join('') + `<div class="card"><h2>Total: ${money(total + 80)}</h2><a class="btn full" href="checkout.html">Proceed to Checkout</a></div>`; count() }
function checkout() { let c = getCart(), total = c.reduce((s, x) => s + products.find(p => p.id === x.id).price * x.qty, 0); document.getElementById('total').textContent = 'Total: ' + money(total + 80); form.onsubmit = e => { e.preventDefault(); localStorage.setItem('ttorder', JSON.stringify({ id: 1026, amount: total + 80, status: 'Processing' })); save([]); alert('Order #1026 placed successfully!'); location.href = 'orders.html' } }
function renderOrders() { let e = document.getElementById('orders'), last = JSON.parse(localStorage.getItem('ttorder') || 'null'), list = last ? [last] : []; e.innerHTML = (list.length ? list : [{ id: 1025, amount: 700, status: 'Completed' }]).map(o => `<div class="card"><b>#${o.id}</b><span> ${money(o.amount)}</span><em>${o.status}</em></div>`).join(''); count() } count();
