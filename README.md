# ShopPWA - E-commerce Progressive Web App

A modern e-commerce Progressive Web Application (PWA) that works offline and supports push notifications. This project was developed as part of the CODTECH internship program.

## Features

- **Progressive Web App (PWA)** - Install on any device
- **Offline Support** - Shop even without an internet connection
- **Push Notifications** - Get updates about orders and promotions
- **Responsive Design** - Works on all devices and screen sizes
- **Modern UI/UX** - Clean and intuitive shopping experience
- **Shopping Cart** - Add, remove, and update items
- **Service Worker** - For caching and offline functionality
- **Background Sync** - Sync orders when back online

## Technologies Used

- HTML5, CSS3, JavaScript (ES6+)
- Service Workers for offline functionality
- Cache API for resource caching
- Web App Manifest for PWA installation
- Push API for notifications
- Background Sync API for offline data synchronization
- LocalStorage for data persistence

## PWA Features Implemented

- **Service Workers**: Handles caching strategies and offline support
- **Cache API**: Stores resources for offline use
- **Web App Manifest**: Enables installation on devices
- **Push Notifications**: Keeps users informed about orders and promotions
- **Background Sync**: Processes offline actions when back online
- **Offline Detection**: Shows offline status and adapts functionality
- **App Install Prompt**: Encourages users to install the PWA

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository or download the source code
2. Navigate to the project directory
3. Install dependencies:

```bash
npm install
```

### Running the Application

Start the development server:

```bash
npm run dev
```

This will start a local server and open the application in your default browser. The app will be available at http://localhost:3000.

### Building for Production

Prepare the application for deployment:

```bash
npm run build
```

### Testing PWA Features

Run a Lighthouse audit to check PWA compliance:

```bash
npm run pwa-audit
```

## Offline Functionality

The application implements several caching strategies:

- **Cache First**: For static assets like HTML, CSS, JS, and images
- **Network First**: For API requests where fresh data is preferred
- **Stale While Revalidate**: For non-critical resources

When offline, the app:

1. Shows an offline indicator
2. Allows browsing previously viewed products
3. Enables adding items to cart
4. Queues orders for submission when back online

## Push Notifications

The app supports push notifications for:

- Order confirmations
- Shipping updates
- Special offers and promotions
- Back-in-stock alerts

Users can enable/disable notifications via the button in the header.

## Project Structure

- `index.html` - Main HTML structure
- `styles.css` - CSS styles and responsive design
- `app.js` - Main application logic
- `sw.js` - Service Worker for offline functionality
- `manifest.json` - Web App Manifest for PWA features
- `icon-*.png` - App icons in various sizes

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- CODTECH for the internship opportunity
- The PWA community for resources and inspiration