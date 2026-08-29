
const CoreTechStore = {
  cartKey: 'coretech.demo.cart.v1',
  orderKey: 'coretech.demo.orders.v1',
  stockKey: 'coretech.demo.stock.v1',
  syncKey: 'coretech.demo.lastsync.v1',

  money: value => new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP',maximumFractionDigits:0}).format(value),

  /* ---------- persistence ---------- */
  cart() { try { return JSON.parse(localStorage.getItem(this.cartKey)) || []; } catch { return []; } },
  saveCart(lines) { localStorage.setItem(this.cartKey, JSON.stringify(lines)); this.updateCount(); },
  orders() { try { return JSON.parse(localStorage.getItem(this.orderKey)) || []; } catch { return []; } },
  saveOrders(list) { localStorage.setItem(this.orderKey, JSON.stringify(list)); },
  stockAdjustments() { try { return JSON.parse(localStorage.getItem(this.stockKey)) || {}; } catch { return {}; } },
  saveStockAdjustments(map) { localStorage.setItem(this.stockKey, JSON.stringify(map)); },

  /* ---------- integration layer: shared live stock ---------- */
  effectiveStock(product) { const sold = this.stockAdjustments()[product.id] || 0; return Math.max(0, product.stock - sold); },
  liveProducts() { return products.map(p => ({ ...p, stock: this.effectiveStock(p) })); },
  recordSale(items) {
    const map = this.stockAdjustments();
    items.forEach(({ productId, quantity }) => { map[productId] = (map[productId] || 0) + quantity; });
    this.saveStockAdjustments(map);
    localStorage.setItem(this.syncKey, String(Date.now()));
    this.markSynced();
  },

  /* ---------- toast ---------- */
  toast(message) { const e=document.getElementById('toast'); if(!e) return; e.textContent=message; e.classList.add('show'); clearTimeout(this.toastTimer); this.toastTimer=setTimeout(()=>e.classList.remove('show'),2800); },

  /* ---------- cart ---------- */
  add(productId, qty) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const stock = this.effectiveStock(product);
    if (stock < 1) return this.toast('This product is currently unavailable.');
    const lines = this.cart();
    const line = lines.find(l => l.productId === productId);
    const requested = Math.max(1, qty || 1);
    const already = line ? line.quantity : 0;
    const room = stock - already;
    if (room < 1) return this.toast(`Only ${stock} units are available.`);
    const add = Math.min(requested, room);
    if (line) line.quantity += add; else lines.push({ productId, quantity: add });
    this.saveCart(lines);
    this.toast(add < requested ? `Only ${stock} in stock — added ${add}.` : `${product.name} added to your cart.`);
  },
  adjust(productId, delta) {
    let lines = this.cart();
    const line = lines.find(l => l.productId === productId);
    const product = products.find(p => p.id === productId);
    if (!line || !product) return;
    const stock = this.effectiveStock(product);
    line.quantity = Math.max(0, Math.min(stock, line.quantity + delta));
    lines = lines.filter(l => l.quantity);
    this.saveCart(lines);
    this.renderCart();
  },
  updateCount() { document.querySelectorAll('[data-cart-count]').forEach(el => el.textContent = this.cart().reduce((sum, line) => sum + line.quantity, 0)); },

  /* ---------- product card ---------- */
  card(product) {
    const stock = this.effectiveStock(product);
    const out = stock < 1;
    return `<article class="product-card">
      <button class="product-image-button" type="button" data-image="images/${product.image}" data-name="${product.name}" aria-label="View ${product.name} image"><img src="images/${product.image}" alt="${product.name}" loading="lazy"></button>
      <div class="product-body">
        <span class="product-category">${product.category}</span>
        <h3 class="product-name">${product.name}</h3>
        <strong class="product-price">${this.money(product.price)}</strong>
        <p class="stock ${stock<=5 && !out?'low':''}">${out?'Out of stock':`${stock} in stock`}</p>
        <div class="product-actions">
          <div class="qty-stepper" ${out?'style="visibility:hidden"':''}>
            <button type="button" data-qty-dec="${product.id}" aria-label="Decrease quantity">−</button>
            <input type="number" min="1" max="${stock||1}" value="1" data-qty-input="${product.id}" aria-label="Quantity">
            <button type="button" data-qty-inc="${product.id}" aria-label="Increase quantity">+</button>
          </div>
          <button class="button" type="button" data-add="${product.id}" ${out?'disabled':''}>${out?'Out of stock':'Add to cart'}</button>
        </div>
      </div>
    </article>`;
  },
  render(id, list) {
    const root = document.getElementById(id);
    if (!root) return;
    root.innerHTML = list.length ? list.map(p => this.card(p)).join('') : '<div class="empty">No products match those filters. Try another search or category.</div>';
    this.updateCount();
  },

  /* ---------- products page ---------- */
  setupProducts() {
    const search = document.getElementById('search'), category = document.getElementById('category'), sort = document.getElementById('sort');
    const params = new URLSearchParams(location.search), requested = params.get('cat'), query = params.get('q');
    if (requested && category) category.value = requested;
    if (query && search) search.value = query;
    const draw = () => {
      let list = products.filter(p => (!category || !category.value || p.category === category.value) && (!search || p.name.toLowerCase().includes(search.value.trim().toLowerCase())));
      if (sort && sort.value === 'price-asc') list = [...list].sort((a,b)=>a.price-b.price);
      else if (sort && sort.value === 'price-desc') list = [...list].sort((a,b)=>b.price-a.price);
      else if (sort && sort.value === 'stock') list = [...list].sort((a,b)=>this.effectiveStock(b)-this.effectiveStock(a));
      this.render('product-list', list);
    };
    search && search.addEventListener('input', draw);
    category && category.addEventListener('change', draw);
    sort && sort.addEventListener('change', draw);
    draw();
    this._redraw = draw;
  },

  /* ---------- cart / checkout / orders ---------- */
  cartDetails() { return this.cart().map(line => ({ line, product: products.find(p => p.id === line.productId) })).filter(x => x.product); },
  total() { return this.cartDetails().reduce((sum, { line, product }) => sum + line.quantity * product.price, 0); },
  renderCart() {
    const root = document.getElementById('cart');
    if (!root) return;
    const items = this.cartDetails();
    if (!items.length) { root.innerHTML = '<div class="empty"><h2>Your cart is empty</h2><p>Add a few student-friendly essentials to get started.</p><a class="button" href="products.html">Browse products</a></div>'; return; }
    const subtotal = this.total(), delivery = 80;
    root.innerHTML = items.map(({ line, product }) => `<div class="row"><div class="row-main"><b>${product.name}</b><span>${this.money(product.price)} each</span><div class="quantity"><button type="button" data-adjust="${product.id}" data-delta="-1" aria-label="Decrease ${product.name}">−</button><b>${line.quantity}</b><button type="button" data-adjust="${product.id}" data-delta="1" aria-label="Increase ${product.name}">+</button><button type="button" class="remove" data-remove="${product.id}">Remove</button></div></div><b class="row-price">${this.money(product.price*line.quantity)}</b></div>`).join('')
      + `<section class="card"><div class="order-total"><span>Subtotal</span><span>${this.money(subtotal)}</span></div><div class="order-total"><span>Delivery fee</span><span>${this.money(delivery)}</span></div><div class="order-total"><span>Total</span><span>${this.money(subtotal+delivery)}</span></div><a class="button" href="checkout.html">Continue to checkout</a></section>`;
  },
  setupCheckout() {
    const form = document.getElementById('checkout-form'), total = document.getElementById('checkout-total'), items = this.cartDetails();
    if (!form) return;
    if (!items.length) { form.innerHTML = '<div class="empty">Your cart is empty. <a href="products.html">Browse products</a></div>'; return; }
    total.textContent = this.money(this.total() + 80);
    form.addEventListener('submit', event => {
      event.preventDefault();
      const details = Object.fromEntries(new FormData(form));
      const order = { id:`CT-${Date.now().toString().slice(-6)}`, createdAt:new Date().toISOString(), customer:details.name, email:details.email, phone:details.phone, address:details.address, payment:details.payment, status:'Processing', items:items.map(({line,product})=>({productId:product.id,name:product.name,price:product.price,quantity:line.quantity})), subtotal:this.total(), deliveryFee:80, total:this.total()+80 };
      this.saveOrders([order, ...this.orders()]);
      /* System Integration in action: POS event -> Inventory decrements -> CRM order log updates. */
      this.recordSale(order.items.map(i => ({ productId: i.productId, quantity: i.quantity })));
      this.saveCart([]);
      location.href = 'orders.html';
    });
  },
  renderOrders() {
    const root = document.getElementById('orders');
    if (!root) return;
    const list = this.orders();
    root.innerHTML = list.length ? list.map(order => `<article class="card"><p class="eyebrow">${new Date(order.createdAt).toLocaleDateString('en-PH',{year:'numeric',month:'short',day:'numeric'})}</p><div class="order-total"><b>${order.id}</b><span class="badge">${order.status}</span></div><p class="muted">${order.items.map(item=>`${item.name} × ${item.quantity}`).join(', ')}</p><div class="order-total"><span>Total</span><strong>${this.money(order.total)}</strong></div></article>`).join('') : '<div class="empty"><h2>No orders yet</h2><p>Your completed demo orders will appear here.</p><a class="button" href="products.html">Shop products</a></div>';
  },

  /* ---------- image modal ---------- */
  openImage(src, name) { const modal=document.getElementById('image-modal'); if(!modal) return; modal.querySelector('img').src=src; modal.querySelector('img').alt=name; modal.querySelector('[data-image-title]').textContent=name; modal.classList.add('show'); modal.querySelector('button').focus(); },
  closeImage() { document.getElementById('image-modal')?.classList.remove('show'); },

  /* ---------- integration rail (visual proof of live sync) ---------- */
  renderSyncRail() {
    document.querySelectorAll('[data-sync-rail]').forEach(el => {
      const t = Number(localStorage.getItem(this.syncKey) || 0);
      const label = t ? this.relativeTime(t) : 'awaiting first sale';
      el.innerHTML = `<span class="rail-label">System Integration</span>
        <span class="sync-node"><span class="sync-dot"></span><b>Storefront</b></span>
        <span class="sync-line"></span>
        <span class="sync-node"><span class="sync-dot"></span><b>Inventory</b></span>
        <span class="sync-line"></span>
        <span class="sync-node"><span class="sync-dot"></span><b>CRM / Orders</b></span>
        <span class="sync-time" data-sync-time>Last sync: ${label}</span>`;
    });
  },
  relativeTime(ts) {
    const s = Math.max(0, Math.round((Date.now()-ts)/1000));
    if (s < 5) return 'just now';
    if (s < 60) return `${s}s ago`;
    const m = Math.round(s/60);
    if (m < 60) return `${m}m ago`;
    return `${Math.round(m/60)}h ago`;
  },
  markSynced() {
    this.renderSyncRail();
    document.querySelectorAll('[data-sync-rail]').forEach(el => { el.classList.add('pulse'); setTimeout(()=>el.classList.remove('pulse'), 750); });
  },

  /* ---------- admin ERP views (same data source, no re-entry) ---------- */
  renderAdminProducts(id) {
    const root = document.getElementById(id); if (!root) return;
    root.innerHTML = `<table><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th></tr>` +
      this.liveProducts().map(p => `<tr><td>${p.name}</td><td>${p.category}</td><td>${this.money(p.price)}</td><td>${p.stock}</td></tr>`).join('') + `</table>`;
  },
  renderAdminInventory(id) {
    const root = document.getElementById(id); if (!root) return;
    root.innerHTML = `<table><tr><th>Product</th><th>Stock</th><th>Supplier</th><th>Status</th></tr>` +
      this.liveProducts().map(p => `<tr><td>${p.name}</td><td>${p.stock}</td><td>${p.supplier}</td><td>${p.stock<1?'<span class="badge" style="background:#f6dede;color:#a5322a">Out of stock</span>':p.stock<=5?'<span class="badge" style="background:#f7ecd8;color:#8f5a24">Reorder</span>':'<span class="badge">Good</span>'}</td></tr>`).join('') + `</table>`;
  },
  renderAdminOrders(id) {
    const root = document.getElementById(id); if (!root) return;
    const list = this.orders();
    root.innerHTML = list.length ? `<table><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th></tr>` +
      list.map(o => `<tr><td>${o.id}</td><td>${o.customer}</td><td>${new Date(o.createdAt).toLocaleDateString('en-PH',{month:'short',day:'numeric'})}</td><td>${this.money(o.total)}</td><td>${o.status}</td></tr>`).join('') + `</table>`
      : `<p class="muted" style="padding:16px 0">No live storefront orders yet. Place a demo order from the customer store to see it appear here in real time.</p>`;
  },
  renderAdminDashboard() {
    const live = this.liveProducts(), ordersList = this.orders();
    const low = live.filter(p => p.stock > 0 && p.stock <= 5);
    const out = live.filter(p => p.stock < 1);
    const good = live.length - low.length - out.length;
    const revenue = ordersList.reduce((s,o)=>s+o.total,0);
    const set = (sel, val) => { const el = document.querySelector(sel); if (el) el.textContent = val; };
    set('[data-stat-products]', live.length);
    set('[data-stat-lowstock]', low.length);
    set('[data-stat-orders]', ordersList.length);
    set('[data-stat-revenue]', this.money(revenue));
    set('[data-stat-good]', good);
    set('[data-stat-low]', low.length);
    set('[data-stat-out]', out.length);
    const recent = document.querySelector('[data-recent-orders]');
    if (recent) recent.innerHTML = ordersList.length ? `<table><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th></tr>` + ordersList.slice(0,5).map(o=>`<tr><td>${o.id}</td><td>${o.customer}</td><td>${this.money(o.total)}</td><td><span class="badge">${o.status}</span></td></tr>`).join('') + `</table>` : `<p class="muted">No storefront orders yet.</p>`;
    const alerts = document.querySelector('[data-inventory-alerts]');
    if (alerts) alerts.innerHTML = (low.length||out.length) ? [...out,...low].slice(0,6).map(p=>`<p>${p.name} — <b class="alert-text">${p.stock}</b></p>`).join('') : `<p class="muted">All products are well stocked.</p>`;
  },

  /* ---------- cross-surface live refresh ---------- */
  refreshCurrentView() {
    this.updateCount();
    if (document.getElementById('product-list')) this._redraw ? this._redraw() : this.setupProducts();
    if (document.getElementById('featured')) this.render('featured', products.slice(0,6));
    if (document.getElementById('cart')) this.renderCart();
    if (document.getElementById('orders')) this.renderOrders();
    if (document.querySelector('[data-admin-products]')) this.renderAdminProducts('admin-products');
    if (document.querySelector('[data-admin-inventory]')) this.renderAdminInventory('admin-inventory');
    if (document.querySelector('[data-admin-orders]')) this.renderAdminOrders('admin-orders');
    if (document.querySelector('[data-stat-products]')) this.renderAdminDashboard();
  },

  /* ---------- wiring ---------- */
  initInteractions() {
    document.addEventListener('click', event => {
      const add=event.target.closest('[data-add]'), adjust=event.target.closest('[data-adjust]'), remove=event.target.closest('[data-remove]'), image=event.target.closest('[data-image]'), qtyInc=event.target.closest('[data-qty-inc]'), qtyDec=event.target.closest('[data-qty-dec]');
      if (add) { const input=document.querySelector(`[data-qty-input="${add.dataset.add}"]`); this.add(Number(add.dataset.add), input?Number(input.value):1); if(input) input.value=1; }
      if (adjust) this.adjust(Number(adjust.dataset.adjust), Number(adjust.dataset.delta));
      if (remove) this.adjust(Number(remove.dataset.remove), -999);
      if (image) this.openImage(image.dataset.image, image.dataset.name);
      if (qtyInc) { const input=document.querySelector(`[data-qty-input="${qtyInc.dataset.qtyInc}"]`); const max=Number(input.max)||99; input.value=Math.min(max, Number(input.value)+1); }
      if (qtyDec) { const input=document.querySelector(`[data-qty-input="${qtyDec.dataset.qtyDec}"]`); input.value=Math.max(1, Number(input.value)-1); }
    });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') this.closeImage(); });
    window.addEventListener('storage', event => {
      if ([this.cartKey, this.stockKey, this.orderKey, this.syncKey].includes(event.key)) {
        this.refreshCurrentView();
        this.markSynced();
      }
    });
    this.updateCount();
    this.renderSyncRail();
  }
};
document.addEventListener('DOMContentLoaded', () => { CoreTechStore.initInteractions(); });
