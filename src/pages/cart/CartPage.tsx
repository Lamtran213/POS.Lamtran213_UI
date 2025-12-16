import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ensureCartForStoredSession, fetchCartForStoredSession, type CartSummary } from "../../lib/cart";
import axiosInstance from "../../axios/instance";
import { useIdentity } from "../../lib/useIdentity";

function CartPage() {
  const navigate = useNavigate();
  const identity = useIdentity();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);
  const [quantityOverrides, setQuantityOverrides] = useState<Record<number, number>>({});

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }),
    [],
  );

  const loadCart = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await ensureCartForStoredSession();
      const data = await fetchCartForStoredSession();

      if (!data) {
        if (!identity) {
          navigate("/login", { replace: true });
          return;
        }
        setCart(null);
        setError("Your cart is empty.");
        return;
      }

      const items = Array.isArray(data.cartItems) ? data.cartItems : [];
      const normalizedCart: CartSummary = {
        ...data,
        cartItems: items,
        totalQuantity:
          typeof data.totalQuantity === "number"
            ? data.totalQuantity
            : items.reduce((accumulator, item) => accumulator + item.quantity, 0),
        totalPrice:
          typeof data.totalPrice === "number"
            ? data.totalPrice
            : items.reduce((accumulator, item) => accumulator + (typeof item.total === "number" ? item.total : item.unitPrice * item.quantity), 0),
      };

      setCart(normalizedCart);
      setQuantityOverrides(
        items.reduce<Record<number, number>>((accumulator, item) => {
          accumulator[item.productId] = item.quantity;
          return accumulator;
        }, {}),
      );
    } catch (requestError) {
      setCart(null);
      setError("Unable to load your cart. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [identity, navigate]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const handleQuantityInputChange = useCallback((productId: number, quantity: number) => {
    setQuantityOverrides((previous) => ({ ...previous, [productId]: quantity }));
  }, []);

  const handleUpdateQuantity = useCallback(
    async (productId: number) => {
      const desiredQuantity = quantityOverrides[productId];
      if (desiredQuantity == null || Number.isNaN(desiredQuantity) || desiredQuantity < 1) {
        toast.error("Quantity must be at least 1.");
        return;
      }

      setUpdatingItemId(productId);

      try {
        await ensureCartForStoredSession();
        const response = await axiosInstance.post<{ isSuccess: boolean }>("/Cart/add-item", {
          productId,
          quantity: desiredQuantity,
        });

        if (!response.data?.isSuccess) {
          toast.error("Unable to update quantity. Please try again.");
          return;
        }

        toast.success("Quantity updated.");
        await loadCart();
      } catch (requestError) {
        toast.error("Unable to update quantity. Please try again.");
      } finally {
        setUpdatingItemId(null);
      }
    },
    [loadCart, quantityOverrides],
  );

  const handleRemoveItem = useCallback(
    async (productId: number) => {
      setUpdatingItemId(productId);

      try {
        await ensureCartForStoredSession();
        const response = await axiosInstance.delete<{ isSuccess: boolean }>(`/Cart/remove-item/${productId}`);

        if (!response.data?.isSuccess) {
          toast.error("Unable to remove this item. Please try again.");
          return;
        }

        toast.success("Item removed from cart.");
        await loadCart();
      } catch (requestError) {
        toast.error("Unable to remove this item. Please try again.");
      } finally {
        setUpdatingItemId(null);
      }
    },
    [loadCart],
  );

  const cartItems = cart?.cartItems ?? [];
  const totalQuantity =
    typeof cart?.totalQuantity === "number"
      ? cart.totalQuantity
      : cartItems.reduce((accumulator, item) => accumulator + item.quantity, 0);
  const totalPrice =
    typeof cart?.totalPrice === "number"
      ? cart.totalPrice
      : cartItems.reduce(
          (accumulator, item) =>
            accumulator + (typeof item.total === "number" ? item.total : item.unitPrice * item.quantity),
          0,
        );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="max-w-md rounded-3xl border border-slate-200 bg-white px-6 py-8 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-600">Loading your cart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="max-w-md space-y-6 rounded-3xl border border-slate-200 bg-white px-6 py-8 text-center shadow-sm">
          <p className="text-base font-semibold text-slate-900">{error}</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={loadCart}
              className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Refresh cart
            </button>
            <Link
              to="/"
              className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!cart || cartItems.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="max-w-md space-y-6 rounded-3xl border border-slate-200 bg-white px-6 py-8 text-center shadow-sm">
          <p className="text-base font-semibold text-slate-900">Your cart is empty.</p>
          <Link
            to="/"
            className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            Browse products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-sm font-semibold text-slate-600 transition hover:text-indigo-600"
          >
            Back
          </button>
          <h1 className="text-lg font-semibold text-slate-900">Your cart</h1>
          <Link
            to="/"
            className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-500"
          >
            Continue shopping
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Items</h2>
          <div className="mt-6 space-y-4">
            {cartItems.map((item) => (
              <article key={item.cartItemId} className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-start">
                <div className="h-20 w-20 overflow-hidden rounded-xl border border-slate-200">
                  <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-base font-semibold text-slate-900">{item.productName}</p>
                  <p className="text-sm text-slate-500">Price: {currencyFormatter.format(item.unitPrice)}</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="text-sm text-slate-500" htmlFor={`quantity-${item.productId}`}>
                      Quantity:
                    </label>
                    <input
                      id={`quantity-${item.productId}`}
                      type="number"
                      min={1}
                      value={quantityOverrides[item.productId] ?? item.quantity}
                      onChange={(event) => handleQuantityInputChange(item.productId, Number(event.target.value))}
                      className="h-9 w-20 rounded-lg border border-slate-300 px-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                    <button
                      type="button"
                      onClick={() => handleUpdateQuantity(item.productId)}
                      disabled={updatingItemId === item.productId}
                      className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {updatingItemId === item.productId ? "Updating..." : "Update"}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-base font-semibold text-slate-900">{currencyFormatter.format(typeof item.total === "number" ? item.total : item.unitPrice * item.quantity)}</p>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.productId)}
                    disabled={updatingItemId === item.productId}
                    className="text-sm font-semibold text-rose-600 transition hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {updatingItemId === item.productId ? "Removing..." : "Remove"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Summary</h2>
          <dl className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <dt>Total items</dt>
              <dd className="font-semibold text-slate-900">{totalQuantity}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Total to pay</dt>
              <dd className="text-base font-semibold text-slate-900">{currencyFormatter.format(totalPrice)}</dd>
            </div>
          </dl>
          <button
            type="button"
            className="mt-6 w-full rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            Proceed to checkout
          </button>
        </aside>
      </main>
    </div>
  );
}

export default CartPage;
