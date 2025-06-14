// public/js/orderSidebar.js

// Global in-memory state to track supplier orders
let supplierOrders = {}; // { supplierId: { name, email, products: [{ id, name, quantity }], notes: "", deliveryDate: "" } }
const MAX_SUPPLIERS = 3;

document.addEventListener("DOMContentLoaded", async () => {
  // Load the order sidebar component
  const sidebar = await fetch("/components/order-sidebar.html").then(res => res.text());
  document.getElementById("sidebarComponent").innerHTML = sidebar;

  // ✅ Attach close button event AFTER sidebar is loaded
  const closeBtn = document.getElementById("closeSidebarBtn");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      document.getElementById("orderSidebar").classList.remove("sidebar-open");
    });
  }
});

function openSidebar() {
  document.getElementById("orderSidebar").classList.add("sidebar-open");
}

function orderStock(supplierId, productId, productName) {
  if (
    Object.keys(supplierOrders).length >= MAX_SUPPLIERS &&
    !supplierOrders[supplierId]
  ) {
    alert("⚠️ You can only order from 3 suppliers at a time.");
    return;
  }

  if (!supplierOrders[supplierId]) {
    // Fetch supplier details first time
    fetch(`/api/suppliers/${supplierId}`)
      .then((res) => res.json())
      .then((supplier) => {
        supplierOrders[supplierId] = {
          name: supplier.name,
          email: supplier.email,
          products: [],
          notes: "",
          deliveryDate: ""
        };
        addProductToSupplier(supplierId, productId, productName);
        openSidebar();
      })
      .catch(() => alert("❌ Failed to fetch supplier details."));
  } else {
    addProductToSupplier(supplierId, productId, productName);
    openSidebar();
  }
}

function addProductToSupplier(supplierId, productId, productName) {
  const supplier = supplierOrders[supplierId];
  const existingProduct = supplier.products.find((p) => p.id === productId);
  if (!existingProduct) {
    supplier.products.push({ id: productId, name: productName, quantity: 1 });
  }
  renderSidebar();
}

function updateQuantity(supplierId, productId, value) {
  const product = supplierOrders[supplierId]?.products.find(p => p.id === productId);
  if (product) {
    product.quantity = Math.max(1, parseInt(value) || 1);
  }
}

function removeProduct(supplierId, productId) {
  const supplier = supplierOrders[supplierId];
  supplier.products = supplier.products.filter((p) => p.id !== productId);
  if (supplier.products.length === 0) {
    delete supplierOrders[supplierId];
  }
  renderSidebar();
}

function updateNotes(supplierId, value) {
  if (supplierOrders[supplierId]) {
    supplierOrders[supplierId].notes = value;
  }
}

function updateDeliveryDate(supplierId, value) {
  if (supplierOrders[supplierId]) {
    supplierOrders[supplierId].deliveryDate = value;
  }
}

async function sendOrder(supplierId) {
  const supplier = supplierOrders[supplierId];
  if (!supplier || supplier.products.length === 0) return;

  const payload = {
    products: supplier.products.map((p) => ({
      productId: p.id,
      quantity: p.quantity
    })),
    notes: supplier.notes,
    deliveryDate: supplier.deliveryDate
  };

  try {
    const res = await fetch(`/api/suppliers/${supplierId}/sendBulkOrderEmail`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Error");

    alert(`✅ Order sent to ${supplier.name}`);
    delete supplierOrders[supplierId];
    renderSidebar();
  } catch (err) {
    console.error(err);
    alert("❌ Failed to send order.");
  }
}

function renderSidebar() {
  const container = document.getElementById("orderSidebarContent");
  container.innerHTML = "";

  Object.entries(supplierOrders).forEach(([supplierId, supplier]) => {
    const section = document.createElement("div");
    section.classList.add("supplier-order-block");

    const productList = supplier.products
      .map(
        (p) => `
        <div class="product-entry">
          <span>${p.name}</span>
          <input type="number" min="1" value="${p.quantity}" onchange="updateQuantity('${supplierId}', '${p.id}', this.value)" />
          <button onclick="removeProduct('${supplierId}', '${p.id}')">❌</button>
        </div>
      `
      )
      .join("");

    section.innerHTML = `
      <h3>📦 ${supplier.name}</h3>
      <p><strong>Email:</strong> ${supplier.email}</p>
      ${productList}
      <textarea placeholder="Optional notes" rows="3" oninput="updateNotes('${supplierId}', this.value)">${supplier.notes}</textarea>
      <label><strong>Delivery Date:</strong></label>
      <input type="date" value="${supplier.deliveryDate}" onchange="updateDeliveryDate('${supplierId}', this.value)" required />
      <button class="send-btn" onclick="sendOrder('${supplierId}')">✉️ Send Order</button>
      <hr/>
    `;

    container.appendChild(section);
  });
}