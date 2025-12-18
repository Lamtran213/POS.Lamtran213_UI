import type { MouseEvent as ReactMouseEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Route, Routes, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import axiosInstance from "./axios/instance";
import Authenticated from "./pages/Authenticated";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import CartPage from "./pages/cart/CartPage";
import ManagerPage from "./pages/manager/ManagerPage";
import ManagerOrdersPage from "./pages/manager/ManagerOrdersPage";
import ManagerProductsPage from "./pages/manager/ManagerProductsPage";
import PaymentCancelPage from "./pages/payment/PaymentCancelPage";
import PaymentSuccessPage from "./pages/payment/PaymentSuccessPage";
import CashOnDeliverySuccessPage from "./pages/payment/CashOnDeliverySuccessPage";
import CheckoutPage from "./pages/checkout/CheckoutPage";
import UserOrdersPage from "./pages/orders/UserOrdersPage";
import { clearAppSession } from "./lib/appSession";
import { useIdentity } from "./lib/useIdentity";
import { supabase } from "../supabaseClient";
import { ensureCartForStoredSession } from "./lib/cart";
import type { ProductListResponse, ProductItem } from "./types/product";

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

const PRODUCT_PAGE_SIZE = 4;

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/authenticated" element={<Authenticated />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/manager" element={<ManagerPage />} />
      <Route path="/manager/orders" element={<ManagerOrdersPage />} />
      <Route path="/manager/products" element={<ManagerProductsPage />} />
      <Route path="/payment/cancel" element={<PaymentCancelPage />} />
      <Route path="/payment/success" element={<PaymentSuccessPage />} />
      <Route path="/payment/cod-success" element={<CashOnDeliverySuccessPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/orders" element={<UserOrdersPage />} />
    </Routes>
  );
}

function HomePage() {
  const navigate = useNavigate();
  const identity = useIdentity();
  const [menuOpen, setMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const currentYear = new Date().getFullYear();
  const displayName = identity?.fullName ?? identity?.email ?? "";
  const avatarInitial = (displayName.charAt(0) || "P").toUpperCase();
  const isManager = identity?.role === "Manager";

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handleClick = (event: MouseEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  useEffect(() => {
    if (!identity) {
      setMenuOpen(false);
    }
  }, [identity]);

  const handlePersonalInfo = useCallback(() => {
    setMenuOpen(false);
    navigate("/authenticated");
  }, [navigate]);

  const handleLogout = useCallback(async () => {
    setMenuOpen(false);
    await supabase.auth.signOut();
    clearAppSession();
    navigate("/login");
  }, [navigate]);

  const handleCartNavigation = useCallback(() => {
    setMenuOpen(false);
    if (!identity) {
      navigate("/login");
      return;
    }
    navigate("/cart");
  }, [identity, navigate]);

  const handleOrdersNavigation = useCallback(() => {
    setMenuOpen(false);
    if (!identity) {
      navigate("/login");
      return;
    }
    navigate("/orders");
  }, [identity, navigate]);

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
                  <button
                    type="button"
                    onClick={handlePersonalInfo}
                    className="text-xs font-medium text-slate-500 transition hover:text-indigo-600"
                  >
                    View workspace
                  </button>
                </div>
                {isManager ? (
                  <Link
                    to="/manager"
                    className="hidden rounded-full border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:border-indigo-300 hover:text-indigo-500 md:inline-flex"
                  >
                    Manager area
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={handleCartNavigation}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600"
                >
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M7 4h-2l-1 2v2h2l3.6 7.59c.09.16.14.34.14.52 0 .66-.54 1.2-1.2 1.2h-1.4v2h14v-2h-10.24c.58 0 1.08-.38 1.23-.95l.03-.13 1.57-6.27h6.18l1.5-6h-16z" />
                  </svg>
                  <span>Cart</span>
                </button>
                <div ref={accountMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen((previous) => !previous);
                    }}
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-indigo-100 bg-indigo-50 text-sm font-semibold text-indigo-600 shadow-sm transition hover:border-indigo-200"
                  >
                    {identity.avatarUrl ? (
                      <img src={identity.avatarUrl} alt="Account avatar" className="h-full w-full object-cover" />
                    ) : (
                      <span>{avatarInitial}</span>
                    )}
                    <span className="sr-only">Open account menu</span>
                  </button>
                  {menuOpen ? (
                    <div className="absolute right-0 z-10 mt-3 w-48 rounded-2xl border border-slate-200 bg-white py-2 shadow-lg shadow-slate-900/10">
                      <button
                        type="button"
                        onClick={handlePersonalInfo}
                        className="flex w-full items-center justify-between px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-indigo-50"
                      >
                        Thông tin cá nhân
                      </button>
                      <button
                        type="button"
                        onClick={handleOrdersNavigation}
                        className="flex w-full items-center justify-between px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-indigo-50"
                      >
                        Đơn hàng của tôi
                      </button>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center justify-between px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                      >
                        Đăng xuất
                      </button>
                    </div>
                  ) : null}
                </div>
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

        <ProductShowcase />

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

function ProductShowcase() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [pageIndex, setPageIndex] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedProductId, setExpandedProductId] = useState<number | null>(null);
  const [addingProductId, setAddingProductId] = useState<number | null>(null);
  const identity = useIdentity();
  const navigate = useNavigate();

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }),
    [],
  );

  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data } = await axiosInstance.get<ProductListResponse>("/Product", {
          params: {
            pageIndex,
            pageSize: PRODUCT_PAGE_SIZE,
          },
        });

        if (!isMounted) {
          return;
        }

        if (!data.success) {
          setError(data.message ?? "Unable to load products.");
          setProducts([]);
          setTotalPages(1);
          setExpandedProductId(null);
          return;
        }

        const payload = data.data;

        if (!payload) {
          setProducts([]);
          setTotalPages(1);
          setExpandedProductId(null);
          return;
        }

        setProducts(payload.items ?? []);
        setTotalPages(payload.totalPages ?? 1);
        setExpandedProductId(null);
      } catch (requestError) {
        if (!isMounted) {
          return;
        }
        setError("Unable to load products.");
        setProducts([]);
        setTotalPages(1);
        setExpandedProductId(null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      isMounted = false;
    };
  }, [pageIndex]);

  const handlePreviousPage = useCallback(() => {
    setPageIndex((previous) => Math.max(1, previous - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setPageIndex((previous) => (previous >= totalPages ? previous : previous + 1));
  }, [totalPages]);

  const toggleProduct = useCallback((productId: number) => {
    setExpandedProductId((previous) => (previous === productId ? null : productId));
  }, []);

  const handleAddToCart = useCallback(
    async (productId: number) => {
      if (!identity) {
        toast.error("Please sign in to add products to your cart.");
        navigate("/login");
        return;
      }

      setAddingProductId(productId);

      try {
        await ensureCartForStoredSession();
        const response = await axiosInstance.post<{ isSuccess: boolean }>("/Cart/add-item", {
          productId,
          quantity: 1,
        });

        if (response.data?.isSuccess) {
          toast.success("Product added to cart.");
        } else {
          toast.error("Unable to add this product. Please try again.");
        }
      } catch (requestError) {
        toast.error("Unable to add this product. Please try again.");
      } finally {
        setAddingProductId(null);
      }
    },
    [identity, navigate],
  );

  return (
    <section id="products" className="bg-gradient-to-b from-white via-slate-50 to-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Featured products</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Explore what is selling now.</h2>
            <p className="mt-3 text-sm text-slate-600">
              The catalog refreshes directly from your store with four items per page.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
            <button
              type="button"
              onClick={handlePreviousPage}
              disabled={loading || pageIndex === 1}
              className="rounded-full border border-slate-200 px-4 py-2 transition hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Trang trước
            </button>
            <span className="text-xs uppercase tracking-wide text-slate-400">
              {pageIndex} / {Math.max(totalPages, 1)}
            </span>
            <button
              type="button"
              onClick={handleNextPage}
              disabled={loading || pageIndex >= totalPages}
              className="rounded-full border border-slate-200 px-4 py-2 transition hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Trang tiếp
            </button>
          </div>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? Array.from({ length: PRODUCT_PAGE_SIZE }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6"
              >
                <div className="mb-4 h-40 w-full rounded-2xl bg-slate-200" />
                <div className="mb-2 h-4 w-3/4 rounded-full bg-slate-200" />
                <div className="h-4 w-1/2 rounded-full bg-slate-200" />
              </div>
            ))
            : null}

          {!loading && error ? (
            <div className="col-span-full rounded-3xl border border-rose-200 bg-rose-50 px-6 py-8 text-center text-sm font-semibold text-rose-600">
              {error}
            </div>
          ) : null}

          {!loading && !error && products.length === 0 ? (
            <div className="col-span-full rounded-3xl border border-slate-200 bg-white px-6 py-8 text-center text-sm text-slate-600">
              No products available yet.
            </div>
          ) : null}

          {!loading && !error
            ? products.map((product) => {
              const expanded = expandedProductId === product.productId;
              return (
                <div
                  key={product.productId}
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleProduct(product.productId)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      toggleProduct(product.productId);
                    }
                  }}
                  className="group flex h-full cursor-pointer flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <div className="relative overflow-hidden rounded-2xl border border-slate-100">
                    <img
                      src={product.imageUrl}
                      alt={product.productName}
                      className="h-40 w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="mt-2 flex-1 space-y-2">
                    <h3 className="text-base font-semibold text-slate-900">{product.productName}</h3>
                    <p className="text-sm font-semibold text-indigo-600">
                      {currencyFormatter.format(product.unitPrice)}
                    </p>
                    {expanded ? (
                      <p className="text-sm leading-relaxed text-slate-600">{product.description}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {expanded ? "Hide details" : "Show details"}
                    </span>
                    <button
                      type="button"
                      onClick={(event: ReactMouseEvent<HTMLButtonElement>) => {
                        event.stopPropagation();
                        if (addingProductId) {
                          return;
                        }
                        handleAddToCart(product.productId);
                      }}
                      disabled={addingProductId === product.productId}
                      className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {addingProductId === product.productId ? "Adding..." : "Add to cart"}
                    </button>
                  </div>
                </div>
              );
            })
            : null}
        </div>
      </div>
    </section>
  );
}

export default App;
