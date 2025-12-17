import { Link } from "react-router-dom";

function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-3xl border border-rose-200 bg-white px-8 py-10 shadow-lg shadow-rose-200/40">
          <span className="inline-flex items-center rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-600">
            Payment failed
          </span>
          <h1 className="mt-4 text-3xl font-bold text-slate-900">Your payment was cancelled</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            We did not charge your card. If this was a mistake, you can return to your cart and try again, or continue shopping to add more items before checking out later.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/cart"
              className="inline-flex w-full items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 sm:w-auto"
            >
              Back to cart
            </Link>
            <Link
              to="/"
              className="inline-flex w-full items-center justify-center rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600 sm:w-auto"
            >
              Continue shopping
            </Link>
          </div>
          <p className="mt-6 text-xs text-slate-500">
            Need help? Contact support and share your order details so we can investigate.
          </p>
        </div>
      </div>
    </div>
  );
}

export default PaymentCancelPage;
