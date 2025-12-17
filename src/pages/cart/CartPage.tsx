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
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(() => new Set());

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
      setSelectedItemIds((previous) => {
        const previousSelection = previous ?? new Set<number>();
        const nextSelection = new Set<number>();
        items.forEach((item) => {
          if (previousSelection.has(item.cartItemId)) {
            nextSelection.add(item.cartItemId);
          }
        });
        if (nextSelection.size === 0 && items.length > 0) {
          items.forEach((item) => {
            nextSelection.add(item.cartItemId);
          });
        }
        return nextSelection;
      });
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
  const cartTotalQuantity =
    typeof cart?.totalQuantity === "number"
      ? cart.totalQuantity
      : cartItems.reduce((accumulator, item) => accumulator + item.quantity, 0);
  const cartTotalPrice =
    typeof cart?.totalPrice === "number"
      ? cart.totalPrice
      : cartItems.reduce(
          (accumulator, item) =>
            accumulator + (typeof item.total === "number" ? item.total : item.unitPrice * item.quantity),
          0,
        );
  const selectedItems = useMemo(
    () => cartItems.filter((item) => selectedItemIds.has(item.cartItemId)),
    [cartItems, selectedItemIds],
  );
  const selectedQuantity = selectedItems.reduce((accumulator, item) => accumulator + item.quantity, 0);
  const selectedTotalPrice = selectedItems.reduce(
    (accumulator, item) => accumulator + (typeof item.total === "number" ? item.total : item.unitPrice * item.quantity),
    0,
  );
  const isEverythingSelected = cartItems.length > 0 && selectedItems.length === cartItems.length;

  const handleToggleItem = useCallback((cartItemId: number) => {
    setSelectedItemIds((previous) => {
      const next = new Set(previous ?? []);
      if (next.has(cartItemId)) {
        next.delete(cartItemId);
      } else {
        next.add(cartItemId);
      }
      return next;
    });
  }, []);

  const handleToggleAll = useCallback(
    (checked: boolean) => {
      if (!checked) {
        setSelectedItemIds(new Set());
        return;
      }
      setSelectedItemIds(new Set(cartItems.map((item) => item.cartItemId)));
    },
    [cartItems],
  );

  const handleProceedToCheckout = useCallback(() => {
    if (selectedItemIds.size === 0) {
      toast.error("Select at least one item to checkout.");
      return;
    }

    navigate("/checkout", {
      state: {
        selectedCartItemIds: Array.from(selectedItemIds),
      },
    });
  }, [navigate, selectedItemIds]);

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
      <div className="min-h-screen bg-slate-50 px-6 py-16">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-8 rounded-3xl border border-slate-200 bg-white px-10 py-16 text-center shadow-lg shadow-slate-900/5">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              className="h-12 w-12"
            >
              <path d="M3 4h2l3.6 7.59c.09.16.14.34.14.52 0 .66-.54 1.2-1.2 1.2h-1.4v2h11.5" />
              <path d="M7 11h11.45l1.4-5.6a1 1 0 0 0-.97-1.27H6.42" />
              <circle cx="9" cy="19" r="1.4" />
              <circle cx="17" cy="19" r="1.4" />
            </svg>
          </div>
          <div className="space-y-3">
            <h1 className="text-2xl font-semibold text-slate-900">Your cart is empty</h1>
            <p className="max-w-xl text-sm text-slate-600">
              Looks like you have not added anything yet. Explore the catalog and discover items tailored for your store.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Browse products
            </Link>
            <Link
              to="/authenticated"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600"
            >
              View account
            </Link>
          </div>
          <div className="flex flex-col items-center gap-2 text-xs text-slate-400 sm:flex-row">
            <span>Top picks refresh every hour.</span>
            <span className="hidden sm:block">·</span>
            <span>Need help? Contact support for curated recommendations.</span>
          </div>
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
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <input
              id="select-all"
              type="checkbox"
              checked={isEverythingSelected}
              onChange={(event) => handleToggleAll(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="select-all" className="cursor-pointer select-none">
              Select all items
            </label>
          </div>
          <div className="mt-6 space-y-4">
            {cartItems.map((item) => (
              <article key={item.cartItemId} className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-start">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedItemIds.has(item.cartItemId)}
                    onChange={() => handleToggleItem(item.cartItemId)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="h-20 w-20 overflow-hidden rounded-xl border border-slate-200">
                    <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" />
                  </div>
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
              <dt>Items in cart</dt>
              <dd className="font-semibold text-slate-900">{cartTotalQuantity}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Cart subtotal</dt>
              <dd className="text-base font-semibold text-slate-900">{currencyFormatter.format(cartTotalPrice)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Selected items</dt>
              <dd className="font-semibold text-slate-900">{selectedQuantity}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Selected subtotal</dt>
              <dd className="text-base font-semibold text-slate-900">{currencyFormatter.format(selectedTotalPrice)}</dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={handleProceedToCheckout}
            disabled={selectedItemIds.size === 0}
            className="mt-6 w-full rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Proceed to checkout
          </button>
        </aside>
      </main>
    </div>
  );
}

export default CartPage;
