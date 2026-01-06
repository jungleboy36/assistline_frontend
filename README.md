🌟 Assistline Frontend

Angular web app providing a responsive, modern interface for Assistline with real-time chat, PayPal payments, and interactive maps.

🛠️ Tech Stack

Framework: Angular & TypeScript

Styling: Bootstrap / Angular Material / CSS

HTTP: HttpClient with interceptors

State: RxJS & Angular services

Realtime: WebSockets

Maps: Google Maps API

Payments: PayPal SDK

Auth: JWT token management

✨ Core Features

🔑 Authentication: JWT login/registration, role-based routes

💬 Chat: Real-time messaging, conversation history, typing indicators

💰 Payments: PayPal integration with order & status tracking

📍 Maps: Location visualization, nearby search, distance calculation

📱 Responsive Design: Mobile-first, adaptive layouts

📝 Forms: Reactive forms with validation & auto-save

🔒 Security: HTTP interceptors, input sanitization, route guards

⚡ Quick Setup
git clone https://github.com/jungleboy36/assistline_frontend.git
cd assistline_frontend
npm install
# Configure src/environments/environment.ts with API, Firebase, PayPal, Maps
ng serve   # http://localhost:4200/
ng build --configuration production

📡 API Highlights

Auth: /api/auth/login, /register

Assistants: /api/assistants/

Payments: /api/payments/initiate

Chat: /api/messages/

Locations: /api/locations/nearby

👤 Author

GitHub: @jungleboy36
