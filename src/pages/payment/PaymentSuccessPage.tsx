import { Link } from "react-router-dom";

function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-3xl border border-emerald-200 bg-white px-8 py-10 shadow-lg shadow-emerald-200/40">
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-600">
            Payment confirmed
          </span>
          <h1 className="mt-4 text-3xl font-bold text-slate-900">Thank you for your purchase!</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            We have received your payment and emailed a receipt. Your order is now processing, and we will notify you when it ships.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Continue shopping
            </Link>
            <Link
              to="/authenticated"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600"
            >
              View orders
            </Link>
          </div>
          <p className="mt-6 text-xs text-slate-500">
            Need assistance? Reply to the receipt email or contact support with your order number.
          </p>
        </div>
      </div>
    </div>
  );
}

export default PaymentSuccessPage;
