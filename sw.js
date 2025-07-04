// Service Worker for ShopPWA
const CACHE_NAME = 'shoppwa-v1';
const STATIC_CACHE = 'shoppwa-static-v1';
const DYNAMIC_CACHE = 'shoppwa-dynamic-v1';
const IMAGE_CACHE = 'shoppwa-images-v1';

// Files to cache immediately
const STATIC_FILES = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/manifest.json',
    '/icon-192x192.png',
    '/icon-512x512.png'
];

// Install event - cache static files
self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('Service Worker: Caching static files');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('Service Worker: Static files cached');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('Service Worker: Error caching static files:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== STATIC_CACHE && 
                            cacheName !== DYNAMIC_CACHE && 
                            cacheName !== IMAGE_CACHE) {
                            console.log('Service Worker: Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Handle different types of requests with appropriate strategies
    if (isStaticFile(request.url)) {
        // Cache First strategy for static files
        event.respondWith(cacheFirst(request, STATIC_CACHE));
    } else if (isImageRequest(request)) {
        // Cache First strategy for images
        event.respondWith(cacheFirst(request, IMAGE_CACHE));
    } else if (isAPIRequest(request.url)) {
        // Network First strategy for API calls
        event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    } else {
        // Stale While Revalidate for other requests
        event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
    }
});

// Cache First Strategy
async function cacheFirst(request, cacheName) {
    try {
        const cache = await caches.open(cacheName);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            console.log('Service Worker: Serving from cache:', request.url);
            return cachedResponse;
        }
        
        console.log('Service Worker: Fetching and caching:', request.url);
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const responseClone = networkResponse.clone();
            await cache.put(request, responseClone);
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Service Worker: Cache First error:', error);
        
        // Return offline fallback for HTML requests
        if (request.destination === 'document') {
            return caches.match('/index.html');
        }
        
        // Return offline fallback for images
        if (isImageRequest(request)) {
            return new Response(
                '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f0f0f0"/><text x="100" y="100" text-anchor="middle" dy=".3em" font-family="Arial" font-size="14" fill="#999">Image Unavailable</text></svg>',
                { headers: { 'Content-Type': 'image/svg+xml' } }
            );
        }
        
        throw error;
    }
}

// Network First Strategy
async function networkFirst(request, cacheName) {
    try {
        console.log('Service Worker: Network first for:', request.url);
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            const responseClone = networkResponse.clone();
            await cache.put(request, responseClone);
        }
        
        return networkResponse;
    } catch (error) {
        console.log('Service Worker: Network failed, trying cache:', request.url);
        const cache = await caches.open(cacheName);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline response for API requests
        if (isAPIRequest(request.url)) {
            return new Response(
                JSON.stringify({ 
                    error: 'Offline', 
                    message: 'This feature is not available offline' 
                }),
                { 
                    headers: { 'Content-Type': 'application/json' },
                    status: 503
                }
            );
        }
        
        throw error;
    }
}

// Stale While Revalidate Strategy
async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    // Fetch in background to update cache
    const fetchPromise = fetch(request)
        .then(networkResponse => {
            if (networkResponse.ok) {
                const responseClone = networkResponse.clone();
                cache.put(request, responseClone);
            }
            return networkResponse;
        })
        .catch(error => {
            console.log('Service Worker: Background fetch failed:', error);
        });
    
    // Return cached version immediately if available
    if (cachedResponse) {
        console.log('Service Worker: Serving stale content:', request.url);
        return cachedResponse;
    }
    
    // If no cache, wait for network
    console.log('Service Worker: No cache, waiting for network:', request.url);
    return fetchPromise;
}

// Helper functions
function isStaticFile(url) {
    return STATIC_FILES.some(file => url.endsWith(file)) ||
           url.includes('.css') ||
           url.includes('.js') ||
           url.includes('.html');
}

function isImageRequest(request) {
    return request.destination === 'image' ||
           request.url.includes('.png') ||
           request.url.includes('.jpg') ||
           request.url.includes('.jpeg') ||
           request.url.includes('.gif') ||
           request.url.includes('.svg') ||
           request.url.includes('.webp');
}

function isAPIRequest(url) {
    return url.includes('/api/') ||
           url.includes('/graphql') ||
           url.includes('api.');
}

// Background Sync for offline actions
self.addEventListener('sync', event => {
    console.log('Service Worker: Background sync triggered:', event.tag);
    
    if (event.tag === 'background-sync-orders') {
        event.waitUntil(syncOrders());
    }
    
    if (event.tag === 'background-sync-cart') {
        event.waitUntil(syncCart());
    }
});

// Sync orders when back online
async function syncOrders() {
    try {
        console.log('Service Worker: Syncing orders...');
        
        // Get pending orders from IndexedDB or localStorage
        const pendingOrders = await getPendingOrders();
        
        for (const order of pendingOrders) {
            try {
                // Attempt to send order to server
                const response = await fetch('/api/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(order)
                });
                
                if (response.ok) {
                    // Remove from pending orders
                    await removePendingOrder(order.id);
                    console.log('Service Worker: Order synced successfully:', order.id);
                    
                    // Show notification
                    self.registration.showNotification('Order Synced', {
                        body: `Order #${order.id} has been processed successfully`,
                        icon: '/icon-192x192.png',
                        badge: '/icon-192x192.png',
                        tag: 'order-sync'
                    });
                }
            } catch (error) {
                console.error('Service Worker: Failed to sync order:', order.id, error);
            }
        }
    } catch (error) {
        console.error('Service Worker: Sync orders failed:', error);
    }
}

// Sync cart when back online
async function syncCart() {
    try {
        console.log('Service Worker: Syncing cart...');
        
        // Get cart data from localStorage
        const cartData = await getCartData();
        
        if (cartData && cartData.length > 0) {
            // Send cart data to server for backup/sync
            const response = await fetch('/api/cart/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ cart: cartData })
            });
            
            if (response.ok) {
                console.log('Service Worker: Cart synced successfully');
            }
        }
    } catch (error) {
        console.error('Service Worker: Sync cart failed:', error);
    }
}

// Helper functions for data management
async function getPendingOrders() {
    // In a real app, this would use IndexedDB
    // For demo purposes, using localStorage simulation
    try {
        const orders = localStorage.getItem('pendingOrders');
        return orders ? JSON.parse(orders) : [];
    } catch {
        return [];
    }
}

async function removePendingOrder(orderId) {
    try {
        const orders = await getPendingOrders();
        const updatedOrders = orders.filter(order => order.id !== orderId);
        localStorage.setItem('pendingOrders', JSON.stringify(updatedOrders));
    } catch (error) {
        console.error('Service Worker: Failed to remove pending order:', error);
    }
}

async function getCartData() {
    try {
        const cart = localStorage.getItem('cart');
        return cart ? JSON.parse(cart) : [];
    } catch {
        return [];
    }
}

// Push notification handling
self.addEventListener('push', event => {
    console.log('Service Worker: Push notification received');
    
    let notificationData = {
        title: 'ShopPWA Notification',
        body: 'You have a new notification',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: 'default'
    };
    
    if (event.data) {
        try {
            const data = event.data.json();
            notificationData = { ...notificationData, ...data };
        } catch (error) {
            console.error('Service Worker: Error parsing push data:', error);
        }
    }
    
    event.waitUntil(
        self.registration.showNotification(notificationData.title, {
            body: notificationData.body,
            icon: notificationData.icon,
            badge: notificationData.badge,
            tag: notificationData.tag,
            requireInteraction: true,
            actions: [
                {
                    action: 'view',
                    title: 'View',
                    icon: '/icon-192x192.png'
                },
                {
                    action: 'dismiss',
                    title: 'Dismiss'
                }
            ]
        })
    );
});

// Notification click handling
self.addEventListener('notificationclick', event => {
    console.log('Service Worker: Notification clicked:', event.action);
    
    event.notification.close();
    
    if (event.action === 'view' || !event.action) {
        // Open the app
        event.waitUntil(
            clients.matchAll({ type: 'window' })
                .then(clientList => {
                    // If app is already open, focus it
                    for (const client of clientList) {
                        if (client.url.includes(self.location.origin) && 'focus' in client) {
                            return client.focus();
                        }
                    }
                    
                    // If app is not open, open it
                    if (clients.openWindow) {
                        return clients.openWindow('/');
                    }
                })
        );
    }
});

// Message handling from main thread
self.addEventListener('message', event => {
    console.log('Service Worker: Message received:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_NAME });
    }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', event => {
    console.log('Service Worker: Periodic sync triggered:', event.tag);
    
    if (event.tag === 'content-sync') {
        event.waitUntil(syncContent());
    }
});

async function syncContent() {
    try {
        console.log('Service Worker: Syncing content...');
        
        // Sync product data, user preferences, etc.
        const response = await fetch('/api/sync');
        
        if (response.ok) {
            const data = await response.json();
            
            // Update cached data
            const cache = await caches.open(DYNAMIC_CACHE);
            await cache.put('/api/products', new Response(JSON.stringify(data.products)));
            
            console.log('Service Worker: Content synced successfully');
        }
    } catch (error) {
        console.error('Service Worker: Content sync failed:', error);
    }
}