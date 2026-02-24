# Smart Janseva (स्मार्ट जनसेवा) - Digital Governance Platform

![Project Banner](https://placehold.co/1200x400/0e0d0b/white?text=Smart+Janseva+-+Digital+Governance+Portal)

## 🏛️ Project Overview
**Smart Janseva** is an enterprise-grade, production-ready e-governance platform designed to bridge the gap between citizens and government services. Built specifically for public touch-based kiosks (Suvidha Kendras) and individual personal access, it provides a seamless, secure, and highly accessible interface for essential civic duties.

---

## 🚀 Project Maturity & Development Status
### Current Stage:
- [ ] Idea only
- [ ] Prototype ready
- [ ] MVP developed
- **[x] Fully functional system**

**Status Notes**: The platform is fully operational with integrated authentication (Supabase), real-time payment processing (Razorpay), AI-powered voice assistance (Groq/Llama-3), and a comprehensive administrative backend.

- **Demo Link**: [Coming Soon / Internal Only]
- **Repository**: [GitHub Link](https://github.com/NayaKunal30/Smart-Janseva)
- **Video Demo**: [Internal Recording Link]

---

## 🏛️ Department-wise Features (Kiosk Interface)

### 🔥 Gas (LPG/Utility)
- **Bill Tracking**: Real-time retrieval of gas connection billing history.
- **Instant Payments**: Integrated payment gateway for settling outstanding dues.
- **Digital Receipts**: Auto-generated PDF receipts for payment acknowledgment.
- **Usage Analytics**: Monthly consumption reports for consumer awareness.

### ⚡ Electricity
- **New Connection**: Digital application for domestic/commercial power lines.
- **Meter Replacement**: Request portal for faulty/upgraded meters.
- **Payment Status**: Visual indicators for pending/paid utility bills.
- **Usage Reports**: Charts showing electricity consumption patterns over time.

### 🏢 Municipal Cooperation
- **Birth/Death Certificates**: End-to-end application and status tracking.
- **Property Tax**: Self-assessment and tax payment module.
- **Ration Card Services**: Apply for new cards or manage existing family records.
- **Trade Licenses**: Digital licensing for local businesses.

### 📢 Grievance Redressal (Complaints)
- **Photo Upload**: Attach evidence (images) directly from the kiosk camera or storage.
- **Status Tracking**: Live updates on complaint resolution progress.
- **Department Tagging**: Automatic routing of complaints to relevant local authorities.

---

## 🖐️ UI/UX for Touch-Based Interfaces
**Is the UI specifically designed for touch-based kiosk usage?**
**YES.**

### Design Considerations:
1. **Kiosk Layout Mode**: A distraction-free, fullscreen layout optimized for public interaction.
2. **On-Screen Keyboard**: Custom-built multilingual virtual keyboard (`KioskKeyboard.tsx`) for data entry without physical hardware.
3. **Large Tap Targets**: All buttons, links, and cards follow a minimum target size of 48px to prevent "fat finger" errors.
4. **Tactile Feedback**: Motion animations (Framer Motion) provide visual confirmation of touch interactions.
5. **Scrollbar-Free UX**: Native-looking scrolling with hidden bars for a cleaner kiosk aesthetic.

---

## 🌍 Deployment & Practical Feasibility
- **Target Environment**: Hybrid (Cloud-orchestrated with local Kiosk hardware).
- **Infrastructure Requirement**:
    - **Client**: Any device with a modern Chromium-based browser (Edge/Chrome).
    - **Server**: Serverless architecture via Supabase (PostgreSQL, Edge Functions).
- **Internet Dependency**: **Medium/High**. 
    - *High* for AI features (Groq) and real-time payments.
    - *Medium* for basic service browsing (implemented with offline-ready layouts).
- **Offline Mode**: Planned (Partial support for cached forms and local data logging).

---

## ♿ Accessibility & Inclusion
### Support Features:
- **👁️ Visually Impaired**: High Contrast mode, Screen Reader support, and Skip-link navigation.
- **👴 Senior Citizens**: **Senior Mode** — featuring enlarged typography (up to 150%), simplified one-tap controls, and extended session timers (15m).
- **🗣️ Regional Languages**: Full support for 11+ languages including Hindi, Marathi, Telugu, Tamil, and Bengali.
- **🎤 Voice Navigation**: Integrated AI Assistant (AI सहायक) powered by Groq and Speech Recognition for hands-free portal usage.

### UI Compliance:
- **WCAG Compliance**: Level AA (2.1) compliant using Radix UI primitives.
- **Government UI Guidelines**: Adheres to **GIGW (Guidelines for Indian Government Websites)** standards for institutional trust.

---

## 🛡️ Security Architecture & Design
### Overall Architecture:
- **Frontend**: Vite + React (TypeScript) for a robust type-safe client.
- **Backend-as-a-Service**: Supabase providing encrypted storage and real-time triggers.
- **Database**: PostgreSQL with multi-tenant row isolation.

### Security Integration:
- **Security by Design**: 
    - **Row Level Security (RLS)**: Every database query is restricted at the kernel level based on the user's JWT.
    - **JWT Authentication**: Industry-standard token-based auth for all operations.
    - **Session Timers**: Automatic kiosk session clearing to prevent data theft in public spaces.
- **Threat Modelling**: Performed regularly to audit entry points (Forms, APIs) against XSS and SQL injection.

---

## 🛠️ Technology Stack
- **Framework**: React 18 (Vite)
- **Backend**: Supabase (Auth, DB, Storage)
- **Styling**: Tailwind CSS + Radix UI
- **AI**: Google Gemini & Groq (Llama-3.3-70b)
- **Payments**: Razorpay
- **Reports**: jsPDF & Recharts

---

&copy; 2024 Smart Janseva - Government of India (Digital India Initiative)
