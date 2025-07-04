// App State
let products = [];
let cart = [];
let isOnline = navigator.onLine;
let deferredPrompt;

// Sample product data
const sampleProducts = [
    {
        id: 1,
        title: "Wireless Headphones",
        description: "High-quality wireless headphones with noise cancellation",
        price: 99.99,
        image: "🎧",
        category: "Electronics"
    },
    {
        id: 2,
        title: "Smart Watch",
        description: "Feature-rich smartwatch with health monitoring",
        price: 199.99,
        image: "⌚",
        category: "Electronics"
    },
    {
        id: 3,
        title: "Laptop Backpack",
        description: "Durable laptop backpack with multiple compartments",
        price: 49.99,
        image: "🎒",
        category: "Accessories"
    },
    {
        id: 4,
        title: "Bluetooth Speaker",
        description: "Portable Bluetooth speaker with excellent sound quality",
        price: 79.99,
        image: "🔊",
        category: "Electronics"
    },
    {
        id: 5,
        title: "Wireless Mouse",
        description: "Ergonomic wireless mouse for productivity",
        price: 29.99,
        image: "🖱️",
        category: "Electronics"
    },
    {
        id: 6,
        title: "Phone Case",
        description: "Protective phone case with premium materials",
        price: 19.99,
        image: "📱",
        category: "Accessories"
    }
];

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadProducts();
    loadCart();
    updateConnectionStatus();
    setupPWAInstall();
});

// Initialize application
function initializeApp() {
    // Load data from localStorage if available
    const savedProducts = localStorage.getItem('products');
    const savedCart = localStorage.getItem('cart');
    
    if (savedProducts) {
        products = JSON.parse(savedProducts);
    } else {
        products = sampleProducts;
        localStorage.setItem('products', JSON.stringify(products));
    }
    
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav a').forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
    
    // Online/Offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Notification button
    const notificationBtn = document.getElementById('notification-btn');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', requestNotificationPermission);
    }
    
    // Checkout button
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', handleCheckout);
    }
}

// Handle navigation
function handleNavigation(e) {
    e.preventDefault();
    const target = e.target.getAttribute('href');
    
    // Hide all sections
    document.querySelectorAll('section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show target section
    const targetSection = document.querySelector(target);
    if (targetSection) {
        targetSection.style.display = 'block';
        
        // Update cart display if navigating to cart
        if (target === '#cart') {
            displayCart();
        }
    }
}

// Scroll to products section
function scrollToProducts() {
    document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
}

// Load and display products
function loadProducts() {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;
    
    productsGrid.innerHTML = '';
    
    products.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
}

// Create product card element
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
        <div class="product-image">${product.image}</div>
        <div class="product-info">
            <h3 class="product-title">${product.title}</h3>
            <p class="product-description">${product.description}</p>
            <div class="product-price">$${product.price.toFixed(2)}</div>
            <button class="add-to-cart" onclick="addToCart(${product.id})">
                Add to Cart
            </button>
        </div>
    `;
    return card;
}

// Add product to cart
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }
    
    saveCart();
    updateCartCount();
    showNotification(`${product.title} added to cart!`);
    
    // Send push notification if permission granted
    if (Notification.permission === 'granted') {
        new Notification('Item Added to Cart', {
            body: `${product.title} has been added to your cart`,
            icon: 'icon-192x192.png',
            badge: 'icon-192x192.png'
        });
    }
}

// Remove item from cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartCount();
    displayCart();
}

// Update item quantity in cart
function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;
    
    item.quantity += change;
    
    if (item.quantity <= 0) {
        removeFromCart(productId);
    } else {
        saveCart();
        updateCartCount();
        displayCart();
    }
}

// Display cart items
function displayCart() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    
    if (!cartItems || !cartTotal) return;
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="empty-cart"><p>Your cart is empty</p></div>';
        cartTotal.textContent = '0.00';
        return;
    }
    
    cartItems.innerHTML = '';
    let total = 0;
    
    cart.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-title">${item.title}</div>
                <div class="cart-item-price">$${item.price.toFixed(2)} each</div>
            </div>
            <div class="quantity-controls">
                <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                <span class="quantity">${item.quantity}</span>
                <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
            </div>
            <button class="remove-item" onclick="removeFromCart(${item.id})">Remove</button>
        `;
        cartItems.appendChild(cartItem);
        total += item.price * item.quantity;
    });
    
    cartTotal.textContent = total.toFixed(2);
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Load cart from localStorage
function loadCart() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartCount();
    }
}

// Update cart count in header
function updateCartCount() {
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
}

// Handle checkout
function handleCheckout() {
    if (cart.length === 0) {
        showNotification('Your cart is empty!');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    if (confirm(`Complete purchase for $${total.toFixed(2)}?`)) {
        // Simulate checkout process
        showNotification('Order placed successfully!');
        
        // Send push notification
        if (Notification.permission === 'granted') {
            new Notification('Order Confirmed', {
                body: `Your order of $${total.toFixed(2)} has been confirmed!`,
                icon: 'icon-192x192.png',
                badge: 'icon-192x192.png'
            });
        }
        
        // Clear cart
        cart = [];
        saveCart();
        updateCartCount();
        displayCart();
    }
}

// Connection status handlers
function handleOnline() {
    isOnline = true;
    updateConnectionStatus();
    hideOfflineBanner();
    syncData();
}

function handleOffline() {
    isOnline = false;
    updateConnectionStatus();
    showOfflineBanner();
}

// Update connection status indicator
function updateConnectionStatus() {
    const statusIndicator = document.getElementById('connection-status');
    if (statusIndicator) {
        statusIndicator.className = isOnline ? 'status-indicator' : 'status-indicator offline';
        statusIndicator.title = isOnline ? 'Online' : 'Offline';
    }
}

// Show offline banner
function showOfflineBanner() {
    const banner = document.getElementById('offline-banner');
    if (banner) {
        banner.style.display = 'block';
        banner.classList.add('show');
    }
}

// Hide offline banner
function hideOfflineBanner() {
    const banner = document.getElementById('offline-banner');
    if (banner) {
        banner.classList.remove('show');
        setTimeout(() => {
            banner.style.display = 'none';
        }, 300);
    }
}

// Sync data when back online
function syncData() {
    // In a real app, this would sync with server
    console.log('Syncing data with server...');
    showNotification('Data synced successfully!');
}

// Request notification permission
function requestNotificationPermission() {
    if (!('Notification' in window)) {
        showNotification('This browser does not support notifications');
        return;
    }
    
    if (Notification.permission === 'granted') {
        showNotification('Notifications are already enabled!');
        return;
    }
    
    if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                showNotification('Notifications enabled successfully!');
                
                // Send welcome notification
                new Notification('Welcome to ShopPWA!', {
                    body: 'You will now receive notifications about your orders and special offers.',
                    icon: 'icon-192x192.png',
                    badge: 'icon-192x192.png'
                });
                
                // Update button
                const btn = document.getElementById('notification-btn');
                if (btn) {
                    btn.textContent = 'Notifications Enabled';
                    btn.disabled = true;
                }
            } else {
                showNotification('Notification permission denied');
            }
        });
    }
}

// Setup PWA install prompt
function setupPWAInstall() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        showInstallPrompt();
    });
    
    // Handle install button click
    const installBtn = document.getElementById('install-btn');
    if (installBtn) {
        installBtn.addEventListener('click', () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('User accepted the install prompt');
                    }
                    deferredPrompt = null;
                    hideInstallPrompt();
                });
            }
        });
    }
    
    // Handle dismiss button click
    const dismissBtn = document.getElementById('dismiss-install');
    if (dismissBtn) {
        dismissBtn.addEventListener('click', hideInstallPrompt);
    }
}

// Show install prompt
function showInstallPrompt() {
    const prompt = document.getElementById('install-prompt');
    if (prompt) {
        prompt.style.display = 'flex';
    }
}

// Hide install prompt
function hideInstallPrompt() {
    const prompt = document.getElementById('install-prompt');
    if (prompt) {
        prompt.style.display = 'none';
    }
}

// Show notification (in-app)
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 5px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 1001;
        transform: translateX(100%);
        transition: transform 0.3s;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Utility function to format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Export functions for global access
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.scrollToProducts = scrollToProducts;