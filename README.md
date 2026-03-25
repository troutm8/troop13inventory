# Troop 13 Gear Inventory

A web application for managing scout troop camping gear. Track what's in the storage shed, check out gear for camping trips, and maintain a full audit trail of who took what and when it was returned.

## Features

- **Inventory Management** — Add, edit, and delete gear items with categories (Shelter, Cooking, Tools, Lighting, First Aid, Navigation, Miscellaneous), quantity, condition, and notes
- **Trip Management** — Create camping trips with date ranges and track their status (Upcoming, Active, Completed)
- **Gear Checkout/Return** — Check out gear for a specific trip, recording who checked it out and when. Return gear with condition assessment and optional notes
- **Visual Status Tracking** — Color-coded status badges show at a glance whether gear is in the storage shed or out on a trip:
  - 🟢 **In Storage** — Available in the shed
  - 🟠 **Checked Out** — Currently on a trip
  - 🔴 **Damaged** — Needs repair
  - ⚫ **Lost** — Missing
- **Audit Trail** — Every action is logged. Each item's detail page shows a full history of checkouts and returns, including who, when, and condition on return
- **Dashboard** — Overview of total inventory, items in storage, items checked out, damaged items, and a recent activity feed
- **Search & Filters** — Search gear by name and filter by category or status

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### Production Build

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Tech Stack

- [React](https://react.dev/) 19
- [Vite](https://vite.dev/) 8
- [Tailwind CSS](https://tailwindcss.com/) 4
- [React Router](https://reactrouter.com/) 7
- [Lucide React](https://lucide.dev/) (icons)

## Data Storage

All data is stored in the browser's localStorage. This means:

- Data persists across page refreshes and browser restarts
- Data is specific to each browser/device
- No server or database setup required

## Project Structure

```
src/
├── components/
│   ├── Layout.jsx         # Sidebar navigation and page layout
│   └── StatusBadge.jsx    # Color-coded status indicator
├── context/
│   └── InventoryContext.jsx  # State management and localStorage persistence
├── pages/
│   ├── Dashboard.jsx      # Home page with stats and activity feed
│   ├── InventoryList.jsx  # Gear list with search and filters
│   ├── ItemDetail.jsx     # Single item view with checkout history
│   ├── ItemForm.jsx       # Add/edit gear form
│   ├── TripDetail.jsx     # Trip view with checkout/return flows
│   └── TripList.jsx       # Trip list with create form
├── App.jsx                # Router configuration
├── main.jsx               # App entry point
└── index.css              # Tailwind CSS import
```
