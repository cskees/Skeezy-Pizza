const orderMessages = [
    "Locating the delivery bike (it is behind a dumpster)...",
    "Checking if we have enough napkins (we do not)...",
    "Consulting with the Pizza Oracle...",
    "Wiping the flour off the screen..."
];

const MENU_ITEMS = [
    {
        name: "The Skeezy Special",
        description: "Extra cheese, extra grease, and a secret spice we found in the alley.",
        price: 12.99
    },
    {
        name: "The Midnight",
        description: "Whatever toppings were left on the counter at 11:59 PM.",
        price: 10.0
    },
    {
        name: "Dumpster Fire Deluxe",
        description: "Pepperoni, jalapeno, and hot honey with enough heat to rethink your life.",
        price: 13.75
    },
    {
        name: "Parking Lot Veggie",
        description: "Roasted peppers, olives, mushrooms, and garlic cream on thin crust.",
        price: 11.5
    }
];

const cart = [];
let lastFocusedElement = null;
const CART_STORAGE_KEY = "skeezy_pizza_cart";
const TAX_RATE = 0.08;

function getFocusableElements(container) {
    return container.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
}

function neonFlicker() {
    const title = document.querySelector('.logo');
    if (!title) {
        return;
    }

    const randomTime = Math.random() * 3000 + 1000;

    setTimeout(() => {
        title.classList.add('flicker');
        setTimeout(() => {
            title.classList.remove('flicker');
            neonFlicker();
        }, Math.random() * 200);
    }, randomTime);
}

function placeOrder() {
    const btn = document.querySelector('#order-btn');
    placeOrderWithButton(btn);
}

function placeOrderWithButton(btn) {
    if (!btn) {
        return;
    }

    const originalText = btn.innerText;
    const randomMsg = orderMessages[Math.floor(Math.random() * orderMessages.length)];

    btn.innerText = randomMsg;
    btn.style.background = '#ffd700';

    setTimeout(() => {
        alert("Order received! Do not look out the window, we will find you.");
        btn.innerText = originalText;
        btn.style.background = '';
    }, 2000);
}

function placeOrderFromCart() {
    if (cart.length === 0) {
        return;
    }

    const btn = document.querySelector('#cart-order-btn');
    placeOrderWithButton(btn);
}

function formatPrice(value) {
    return Number(value).toFixed(2);
}

function renderMenu() {
    const menuGrid = document.querySelector('#menu-grid');
    if (!menuGrid) {
        return;
    }

    menuGrid.innerHTML = MENU_ITEMS.map((item) => `
        <article class="pizza-card" data-name="${item.name}" data-price="${item.price}">
            <h4>${item.name}</h4>
            <p>${item.description}</p>
            <strong>$${formatPrice(item.price)}</strong>
            <button class="add-btn" type="button">Add to Cart</button>
        </article>
    `).join('');
}

function saveCart() {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
        // Ignore storage errors (private mode, blocked storage, quota exceeded).
    }
}

function loadCart() {
    try {
        const raw = localStorage.getItem(CART_STORAGE_KEY);
        if (!raw) {
            return;
        }

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            return;
        }

        parsed.forEach((item) => {
            if (
                item &&
                typeof item.name === 'string' &&
                typeof item.price === 'number' &&
                Number.isFinite(item.price) &&
                typeof item.quantity === 'number' &&
                Number.isInteger(item.quantity) &&
                item.quantity > 0
            ) {
                cart.push({
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity
                });
            }
        });
    } catch {
        // Ignore malformed JSON or unavailable storage.
    }
}

function updateCartView() {
    const cartList = document.querySelector('#cart-list');
    const cartCount = document.querySelector('#cart-count');
    const cartSubtotal = document.querySelector('#cart-subtotal');
    const cartTax = document.querySelector('#cart-tax');
    const cartTotal = document.querySelector('#cart-total');
    const cartEmpty = document.querySelector('#cart-empty');
    const cartOrderBtn = document.querySelector('#cart-order-btn');

    if (!cartList || !cartCount || !cartSubtotal || !cartTax || !cartTotal || !cartEmpty) {
        return;
    }

    cartList.innerHTML = '';

    let count = 0;
    let subtotal = 0;

    cart.forEach((item, index) => {
        count += item.quantity;
        subtotal += item.quantity * item.price;

        const li = document.createElement('li');
        li.className = 'cart-row';
        li.innerHTML = `
            <div>
                <div class="item-name">${item.name}</div>
                <div class="item-sub">$${formatPrice(item.price)} x ${item.quantity}</div>
            </div>
            <div class="qty-controls">
                <button class="qty-btn" data-action="decrement" data-index="${index}" type="button" aria-label="Decrease quantity">-</button>
                <span class="qty-value" aria-live="polite">${item.quantity}</span>
                <button class="qty-btn" data-action="increment" data-index="${index}" type="button" aria-label="Increase quantity">+</button>
            </div>
        `;
        cartList.appendChild(li);
    });

    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;

    cartCount.textContent = String(count);
    cartSubtotal.textContent = formatPrice(subtotal);
    cartTax.textContent = formatPrice(tax);
    cartTotal.textContent = formatPrice(total);
    cartEmpty.classList.toggle('hidden', cart.length > 0);
    if (cartOrderBtn instanceof HTMLButtonElement) {
        cartOrderBtn.disabled = cart.length === 0;
    }
}

function addToCart(name, price) {
    const existing = cart.find((item) => item.name === name);

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ name, price, quantity: 1 });
    }

    updateCartView();
    saveCart();
}

function removeFromCart(index) {
    if (index < 0 || index >= cart.length) {
        return;
    }

    cart.splice(index, 1);
    updateCartView();
    saveCart();
}

function updateQuantity(index, delta) {
    if (index < 0 || index >= cart.length) {
        return;
    }

    const nextQuantity = cart[index].quantity + delta;
    if (nextQuantity <= 0) {
        removeFromCart(index);
        return;
    }

    cart[index].quantity = nextQuantity;
    updateCartView();
    saveCart();
}

function openCart() {
    const modal = document.querySelector('#cart-modal');
    const cartToggle = document.querySelector('#cart-toggle');
    const panel = document.querySelector('.cart-panel');
    if (modal) {
        lastFocusedElement = document.activeElement;
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
    }
    if (cartToggle) {
        cartToggle.setAttribute('aria-expanded', 'true');
    }
    if (panel instanceof HTMLElement) {
        panel.focus();
    }
}

function closeCart() {
    const modal = document.querySelector('#cart-modal');
    const cartToggle = document.querySelector('#cart-toggle');
    if (modal) {
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
    }
    if (cartToggle) {
        cartToggle.setAttribute('aria-expanded', 'false');
    }
    if (lastFocusedElement instanceof HTMLElement) {
        lastFocusedElement.focus();
        lastFocusedElement = null;
    }
}

function handleModalKeydown(event) {
    const modal = document.querySelector('#cart-modal');
    if (!modal || modal.classList.contains('hidden')) {
        return;
    }

    if (event.key === 'Escape') {
        closeCart();
        return;
    }

    if (event.key !== 'Tab') {
        return;
    }

    const focusables = getFocusableElements(modal);
    if (focusables.length === 0) {
        return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
        return;
    }

    if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    neonFlicker();
    renderMenu();
    loadCart();
    updateCartView();

    const orderBtn = document.querySelector('#order-btn');
    if (orderBtn) {
        orderBtn.addEventListener('click', placeOrder);
    }

    const menuGrid = document.querySelector('#menu-grid');
    if (menuGrid) {
        menuGrid.addEventListener('click', (event) => {
            const target = event.target;
            if (!(target instanceof HTMLElement) || !target.classList.contains('add-btn')) {
                return;
            }

            const card = target.closest('.pizza-card');
            if (!card) {
                return;
            }

            const name = card.dataset.name;
            const price = Number(card.dataset.price);
            if (!name || Number.isNaN(price)) {
                return;
            }

            addToCart(name, price);
        });
    }

    const cartToggle = document.querySelector('#cart-toggle');
    if (cartToggle) {
        cartToggle.addEventListener('click', openCart);
    }

    const cartClose = document.querySelector('#cart-close');
    if (cartClose) {
        cartClose.addEventListener('click', closeCart);
    }

    const cartClear = document.querySelector('#cart-clear');
    if (cartClear) {
        cartClear.addEventListener('click', () => {
            cart.length = 0;
            updateCartView();
            saveCart();
        });
    }

    const cartOrderBtn = document.querySelector('#cart-order-btn');
    if (cartOrderBtn) {
        cartOrderBtn.addEventListener('click', placeOrderFromCart);
    }

    const cartModal = document.querySelector('#cart-modal');
    if (cartModal) {
        cartModal.addEventListener('click', (event) => {
            if (event.target === cartModal) {
                closeCart();
            }
        });
        document.addEventListener('keydown', handleModalKeydown);
    }

    const cartList = document.querySelector('#cart-list');
    if (cartList) {
        cartList.addEventListener('click', (event) => {
            const target = event.target;
            if (!(target instanceof HTMLElement) || !target.classList.contains('qty-btn')) {
                return;
            }

            const action = target.dataset.action;
            const index = Number(target.dataset.index);
            if (!Number.isInteger(index)) {
                return;
            }

            if (action === 'increment') {
                updateQuantity(index, 1);
                return;
            }

            if (action === 'decrement') {
                updateQuantity(index, -1);
            }
        });
    }
});
