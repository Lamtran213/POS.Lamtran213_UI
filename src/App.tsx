import { Link, Route, Routes } from "react-router-dom";
import Authenticated from "./pages/Authenticated";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import { useIdentity } from "./lib/useIdentity";

const heroMetrics = [
  { value: "5 min", label: "Setup time" },
  { value: "99.9%", label: "Uptime" },
  { value: "24/7", label: "Support" },
];

const featureCards = [
  {
    abbr: "INV",
    title: "Inventory in sync",
    description: "Track stock across registers, locations, and online channels in a single dashboard.",
  },
  {
    abbr: "CRM",
    title: "Customer profiles",
    description: "Loyalty-ready customer records with purchase history, notes, and segmentation tools.",
  },
  {
    abbr: "OMN",
    title: "Omnichannel ready",
    description: "Handle curbside pickup, delivery, and in-store orders without switching systems.",
  },
  {
    abbr: "RPT",
    title: "Actionable reports",
    description: "Daily sales snapshots, product performance, and staff productivity in real time.",
  },
  {
    abbr: "PAY",
    title: "Integrated payments",
    description: "Secure card, QR, and cash handling with automatic reconciliation at closeout.",
  },
  {
    abbr: "AUT",
    title: "Automated tasks",
    description: "Low-stock alerts, reorder reminders, and email receipts to keep operations running.",
  },
];

const workflowSteps = [
  {
    title: "Configure your catalog",
    description: "Import existing products or scan items to create SKUs with pricing, taxes, and modifiers.",
  },
  {
    title: "Train the team",
    description: "Interactive guided mode gets new staff ringing up sales, splitting bills, and processing returns fast.",
  },
  {
    title: "Measure and improve",
    description: "Use live dashboards to identify best sellers, set targets, and schedule staff based on demand.",
  },
];

const sampleTickets = [
  { id: "INV-1042", customer: "Sarah Khan", amount: "$128.40" },
  { id: "INV-1043", customer: "Leo Turner", amount: "$42.10" },
  { id: "INV-1044", customer: "Mia Chen", amount: "$86.25" },
];

const pricingHighlights = [
  "1 register plus unlimited staff logins",
  "Real-time inventory and barcode printing",
  "Integrated payments with next-day deposits",
  "Email and chat support around the clock",
];

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/authenticated" element={<Authenticated />} />
    </Routes>
  );
}

function HomePage() {
  const identity = useIdentity();
  const currentYear = new Date().getFullYear();
  const displayName = identity?.fullName ?? identity?.email ?? "";
  const avatarInitial = (displayName.charAt(0) || "P").toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-sm font-semibold uppercase tracking-wide text-white">
              POS
            </span>
            <span className="leading-tight">
              <span className="block text-base font-semibold">POS.Lamtran213</span>
              <span className="block text-xs text-slate-500">Retail made simple</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a className="transition hover:text-indigo-600" href="#features">
              Features
            </a>
            <a className="transition hover:text-indigo-600" href="#workflow">
              Workflow
            </a>
            <a className="transition hover:text-indigo-600" href="#pricing">
              Pricing
            </a>
            <a className="transition hover:text-indigo-600" href="#faq">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {identity ? (
              <>
                <div className="hidden text-right leading-tight md:block">
                  <p className="text-sm font-semibold text-slate-900">{displayName}</p>
                  <p className="text-xs text-slate-500">View workspace</p>
                </div>
                <Link
                  to="/authenticated"
                  className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-indigo-100 bg-indigo-50 text-sm font-semibold text-indigo-600 shadow-sm transition hover:border-indigo-200"
                >
                  {identity.avatarUrl ? (
                    <img src={identity.avatarUrl} alt="Account avatar" className="h-full w-full object-cover" />
                  ) : (
                    <span>{avatarInitial}</span>
                  )}
                  <span className="sr-only">Open account</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600"
                >
                  Register
                </Link>
                <Link
                  to="/login"
                  className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
                >
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div className="space-y-10">
            <span className="inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-600">
              Modern POS for growing teams
            </span>
            <div className="space-y-6">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Sell anywhere, manage everywhere.
              </h1>
              <p className="max-w-xl text-base text-slate-600 sm:text-lg">
                Centralize in-store and online orders, keep shelves stocked, and close every day with confidence. POS.Lamtran213 connects your catalog, payments, and reporting so your staff can focus on the customer.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                to="/register"
                className="w-full rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 sm:w-auto"
              >
                Start free trial
              </Link>
              <Link
                to="/login"
                className="w-full rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600 sm:w-auto"
              >
                Book a demo
              </Link>
            </div>

            <div className="flex flex-wrap gap-8 border-t border-slate-200 pt-6">
              {heroMetrics.map((metric) => (
                <div key={metric.label} className="min-w-[120px]">
                  <p className="text-3xl font-semibold text-slate-900">{metric.value}</p>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    {metric.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div
              className="absolute inset-x-10 -top-10 bottom-6 rounded-3xl bg-gradient-to-br from-indigo-100 via-white to-emerald-100 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative mx-auto w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-indigo-200/40">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-600">Front counter</p>
                  <p className="text-xs text-slate-400">Register 2 - Today</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">
                  Online
                </span>
              </div>

              <div className="mt-6 space-y-4">
                {sampleTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{ticket.customer}</p>
                      <p className="text-xs text-slate-500">Order {ticket.id}</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">{ticket.amount}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50 px-4 py-5 text-center">
                <p className="text-sm font-semibold text-indigo-600">Need to split the bill?</p>
                <p className="mt-1 text-xs text-indigo-500">Tap once to divide by seats, items, or custom amounts.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="bg-white py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Everything you need</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Run your whole business from one platform.</h2>
              <p className="mt-4 text-base text-slate-600">
                Inventory, sales, staff, and customers stay connected so you get clean books and reliable insights without juggling spreadsheets.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featureCards.map((feature) => (
                <article
                  key={feature.title}
                  className="h-full rounded-2xl border border-slate-200 bg-slate-50/80 p-6 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600">
                    {feature.abbr}
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-slate-900">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="workflow" className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Workflow</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">From setup to insights in three steps.</h2>
              <p className="mt-4 text-base text-slate-600">
                We provide playbooks, guided onboarding, and ready-to-use templates so you can go live without disruption.
              </p>
            </div>
            <ol className="space-y-6">
              {workflowSteps.map((step, index) => (
                <li
                  key={step.title}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{step.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.description}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="pricing" className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-sky-500 py-20 text-white">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-center">
              <div className="space-y-4">
                <p className="text-sm font-semibold uppercase tracking-wide text-indigo-100">Pricing</p>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Simple plans that scale with your stores.</h2>
                <p className="text-base text-indigo-100/90">
                  Start free, add registers only when you need them. Every plan includes unlimited products, customers, and nightly backups.
                </p>
              </div>
              <div className="rounded-3xl bg-white/10 p-8 shadow-xl shadow-black/10 backdrop-blur">
                <div className="flex items-baseline justify-between">
                  <p className="text-lg font-semibold text-indigo-100">Starter</p>
                  <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                    Best for new stores
                  </span>
                </div>
                <p className="mt-6 text-4xl font-bold">$39<span className="text-lg font-medium">/mo</span></p>
                <ul className="mt-6 space-y-3 text-sm text-indigo-100/90">
                  {pricingHighlights.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-white" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className="mt-8 block w-full rounded-full bg-white px-6 py-3 text-center text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50"
                >
                  Choose Starter
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-4xl px-6 py-20">
          <div className="space-y-6 text-slate-700">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Frequently asked questions</h2>
            <div className="space-y-4">
              <details className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <summary className="cursor-pointer text-sm font-semibold text-slate-900">
                  Can I migrate data from my existing POS?
                </summary>
                <p className="mt-3 text-sm text-slate-600">
                  Yes. Upload spreadsheets or connect your current POS via our migration wizard. We import products, customers, and historical sales at no additional cost.
                </p>
              </details>
              <details className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <summary className="cursor-pointer text-sm font-semibold text-slate-900">
                  Does POS.Lamtran213 work offline?
                </summary>
                <p className="mt-3 text-sm text-slate-600">
                  Your registers stay available during outages. Transactions queue securely and sync once the connection returns so your totals remain accurate.
                </p>
              </details>
              <details className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <summary className="cursor-pointer text-sm font-semibold text-slate-900">
                  How many staff accounts are included?
                </summary>
                <p className="mt-3 text-sm text-slate-600">
                  All plans include unlimited staff accounts with role-based permissions, time tracking, and PIN-based login for quick switching.
                </p>
              </details>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-slate-500 sm:flex-row">
          <p>&copy; {currentYear} POS.Lamtran213. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a className="transition hover:text-indigo-600" href="#">Privacy</a>
            <a className="transition hover:text-indigo-600" href="#">Terms</a>
            <a className="transition hover:text-indigo-600" href="#">Status</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
