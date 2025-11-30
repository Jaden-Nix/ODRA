# ODRA-EVM Universal Contract Engine - Design Guidelines

## Design Approach

**Selected Framework:** Design System Approach (Developer Tool Category)
**Primary References:** Linear (dashboard/UI polish), VS Code (editor aesthetics), Vercel (technical clarity), GitHub (code presentation)

**Rationale:** This is a utility-focused blockchain development platform where efficiency, clarity, and technical precision are paramount. Developers need clear visual hierarchy, instant comprehension of compilation status, and distraction-free code editing.

---

## Typography System

**Font Families:**
- Interface: Inter (headers, UI elements, navigation) - via Google Fonts
- Code/Technical: JetBrains Mono (code editor, technical output, contract addresses) - via Google Fonts

**Type Scale:**
- Hero/Page Headers: text-4xl to text-5xl, font-semibold
- Section Headers: text-2xl, font-semibold  
- Subsection Headers: text-xl, font-medium
- Body Text: text-base, font-normal
- Small Text/Metadata: text-sm, font-normal
- Code/Technical: text-sm font-mono, leading-relaxed
- Micro Labels: text-xs, font-medium, uppercase tracking-wide

---

## Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16
- Micro spacing (between related elements): p-2, gap-2
- Standard spacing (component padding): p-4, p-6  
- Section spacing (major divisions): p-8, p-12
- Page margins: p-16 (desktop), p-6 (mobile)

**Grid Structure:**
- Dashboard uses sidebar + main content pattern
- Sidebar: fixed width 64 (w-64) on desktop, collapsible on mobile
- Main content area: flex-1 with max-w-7xl container
- Multi-column grids for status cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-4

---

## Component Library

### Navigation & Structure

**Top Navigation Bar:**
- Full-width header with border-b
- Height: h-16
- Left: Logo + product name
- Center: Primary navigation tabs (Dashboard, Editor, Deploy, Analytics)
- Right: Wallet connection status + user menu
- Use Heroicons for all icons

**Sidebar Navigation:**
- Fixed left sidebar (w-64)
- Sections: Quick Actions, Recent Contracts, Resources
- Each nav item: p-3, rounded-lg, gap-3
- Icon (h-5 w-5) + label layout

**Dashboard Layout:**
- Top stats bar: 4-column grid showing key metrics (Contracts Deployed, Total Gas Used, Success Rate, Network Status)
- Each stat card: p-6, rounded-xl, border
- Main content: 2-column layout (lg:grid-cols-3) with primary content spanning col-span-2

### Code Editor Section

**Editor Container:**
- Full-height panel with Monaco Editor integration
- Top toolbar: File name + compilation status badge + actions (Compile, Deploy, Save)
- Editor frame: rounded-lg, border, min-h-96
- Bottom panel: Compilation output/errors (h-48, resizable)
- Line numbers visible, syntax highlighting enabled

**Compilation Status Indicator:**
- Positioned top-right of editor
- Pills showing: "Compiling..." (animated pulse), "Success" (with checkmark icon), "Error" (with warning icon)
- Include timestamp and compilation time (e.g., "Compiled in 1.2s")

### AI Analysis Panel

**Right Sidebar Panel:**
- Fixed width: w-96
- Sticky positioning during scroll
- Sections stacked vertically with gap-6:
  1. Security Risk Score (large circular progress indicator)
  2. Vulnerability List (scrollable, max-h-64)
  3. AI Suggestions (collapsible accordion items)
  4. Gas Optimization Tips

**Risk Score Display:**
- Centered large number (text-6xl font-bold)
- Circular progress ring around it
- Label beneath: "Security Score"
- Risk level indicator (Critical/High/Medium/Low)

### Deployment Dashboard

**Contract Cards:**
- Grid layout: grid-cols-1 lg:grid-cols-2 gap-6
- Each card: p-6, rounded-xl, border
- Header: Contract name (text-lg font-semibold) + status badge
- Body: Contract address (font-mono text-sm, truncate), deployment timestamp
- Footer: Action buttons (View, Interact, Verify)
- Hover state: subtle border emphasis

**Transaction Timeline:**
- Vertical timeline with connector lines
- Each transaction: flex layout with icon (left), content (center), timestamp (right)
- Transaction hash: font-mono, text-xs, copy button
- Status indicator: colored dot (pending/success/failed)

### Staking Interface

**Position Cards:**
- Large cards showing staked amount (text-3xl font-bold)
- APY percentage highlighted (accent treatment)
- Duration/unlock countdown timer
- Staking/unstaking action buttons
- Historical yield chart (use Chart.js integration)

**Yield Calculator:**
- Input fields: Amount to stake, Duration selector
- Real-time calculation display showing projected returns
- Comparison table: Current APY vs Historical Average

### Cross-Chain Bridge Visualizer

**Bridge Flow Diagram:**
- Horizontal flow: Source (Sepolia) → Bridge Contract → Destination (Casper)
- Visual connectors with animated progress indicators
- Token amount boxes at each stage
- Status checkpoints with icons (Heroicons: check, clock, x-mark)

**Transaction Monitor:**
- Live feed of bridge transactions
- Each entry: from address → to address, amount, status
- Real-time updates with smooth entrance animations

### Forms & Inputs

**Input Fields:**
- Height: h-12
- Padding: px-4
- Rounded: rounded-lg
- Border: border with focus:ring-2
- Label above: text-sm font-medium, mb-2
- Helper text below: text-xs
- Error states: border-red with error message

**Buttons:**
- Primary: h-12, px-6, rounded-lg, font-medium
- Secondary: same sizing, border variant
- Icon buttons: h-10 w-10, rounded-lg
- Loading states: disabled with spinner icon
- Button groups: gap-3 horizontal layout

**Code Input/Display:**
- Font: font-mono
- Background treatment for code blocks
- Syntax highlighting for addresses/hashes
- Inline copy buttons on hover

### Data Tables

**Contract List Table:**
- Full-width with responsive scroll
- Headers: sticky top-0, text-xs uppercase font-medium
- Rows: hover state, alternating subtle background
- Columns: Name, Address (mono font, truncate), Status, Gas Used, Timestamp, Actions
- Pagination at bottom

### Alerts & Notifications

**Toast Notifications:**
- Position: fixed top-4 right-4
- Width: w-96
- Padding: p-4
- Rounded: rounded-lg
- Icon + message + dismiss button
- Auto-dismiss after 5s
- Success/Error/Warning variants

**Inline Alerts:**
- Full-width banners for important messages
- Border-l-4 accent
- Icon (h-5 w-5) + content layout
- Dismissible with X button

### Loading States

**Skeleton Loaders:**
- Match final component dimensions
- Animated pulse effect
- Use for: tables (rows), cards, text blocks
- Maintain layout stability

**Progress Indicators:**
- Compilation: linear progress bar
- Deployment: stepped progress (4 stages)
- Transaction: spinning loader with percentage

---

## Animations

**Minimal, Purposeful Motion:**
- Page transitions: none (instant)
- Component entrance: fade-in only on initial load
- Hover states: smooth scale/border transitions (transition-all duration-200)
- Loading spinners: continuous rotation
- Progress bars: smooth width transitions
- NO scroll-triggered animations
- NO parallax effects
- NO complex choreography

---

## Images

**Hero Section (Dashboard Landing):**
- Not applicable - this is an application dashboard, not a marketing page
- Jump directly into functional interface

**Illustrations/Graphics:**
- Network status visualization (Casper testnet node map)
- Bridge flow diagram uses iconography, not photos
- Gas optimization graphs (charts, not images)
- All visuals are data-driven UI components

---

## Accessibility

- All interactive elements: min-height h-10 (40px touch target)
- Focus indicators: ring-2 with offset on all focusable elements
- ARIA labels on icon-only buttons
- Form inputs: associated labels, error announcements
- Keyboard navigation: tab order matches visual hierarchy
- Status indicators: combine icon + text (not color alone)

---

## Responsive Behavior

**Breakpoint Strategy:**
- Mobile (< 768px): Stack all multi-column layouts, collapse sidebar to overlay
- Tablet (768px - 1024px): 2-column grids, persistent sidebar
- Desktop (> 1024px): Full 3-4 column layouts, all panels visible

**Mobile Adaptations:**
- Editor: Full-screen modal mode
- Tables: Horizontal scroll with sticky first column
- Sidebar: Hamburger menu overlay
- Stats: Vertical stack, full-width cards