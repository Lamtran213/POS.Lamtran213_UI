import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../../axios/instance";
import { ensureCartForStoredSession, fetchCartForStoredSession, type CartItem } from "../../lib/cart";
import { useIdentity } from "../../lib/useIdentity";
import type { StandardResponse } from "../../types/auth";

interface CheckoutLocationState {
  selectedCartItemIds?: number[];
}

interface ProvinceSummary {
  code: number;
  name: string;
  districts?: DistrictSummary[];
}

interface DistrictSummary {
  code: number;
  name: string;
}

interface OrderCreateResponse {
  isSuccess?: boolean;
  success?: boolean;
  message?: string;
  orderId?: number;
  paymentUrl?: string;
  isPaid?: boolean;
  paymentStatus?: number;
  [key: string]: unknown;
}

const DEFAULT_FREIGHT = 30000;

function CheckoutPage() {
  const identity = useIdentity();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as CheckoutLocationState | null;

  const selectedCartItemIds = useMemo(
    () => Array.from(new Set(locationState?.selectedCartItemIds ?? [])),
    [locationState],
  );

  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [freight, setFreight] = useState<number>(DEFAULT_FREIGHT);
  const [paymentMethod, setPaymentMethod] = useState<number>(1);
  const [provinces, setProvinces] = useState<ProvinceSummary[]>([]);
  const [districts, setDistricts] = useState<DistrictSummary[]>([]);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<number | "">("");
  const [selectedDistrictCode, setSelectedDistrictCode] = useState<number | "">("");
  const [specificAddress, setSpecificAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!selectedCartItemIds.length) {
      navigate("/cart", { replace: true });
    }
  }, [navigate, selectedCartItemIds]);

  useEffect(() => {
    let isMounted = true;

    const loadCart = async () => {
      if (!selectedCartItemIds.length) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        await ensureCartForStoredSession();
        const summary = await fetchCartForStoredSession();

        if (!summary) {
          toast.error("Unable to load cart for checkout.");
          navigate("/cart", { replace: true });
          return;
        }

        const items = summary.cartItems.filter((item) => selectedCartItemIds.includes(item.cartItemId));

        if (!items.length) {
          toast.error("Selected items are no longer available.");
          navigate("/cart", { replace: true });
          return;
        }

        if (isMounted) {
          setCartItems(items);
        }
      } catch (error) {
        console.warn("Failed to load checkout cart: ", error);
        toast.error("Unable to load cart for checkout.");
        navigate("/cart", { replace: true });
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadCart();

    return () => {
      isMounted = false;
    };
  }, [navigate, selectedCartItemIds]);

  useEffect(() => {
    let isMounted = true;

    const loadProvinces = async () => {
      try {
        const response = await fetch("https://provinces.open-api.vn/api/?depth=2");
        if (!response.ok) {
          throw new Error("Failed to fetch provinces");
        }
        const data = (await response.json()) as ProvinceSummary[];
        if (isMounted) {
          setProvinces(data);
        }
      } catch (error) {
        console.warn("Failed to fetch provinces:", error);
        toast.error("Unable to load provinces.");
      }
    };

    loadProvinces();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (selectedProvinceCode === "") {
      setDistricts([]);
      setSelectedDistrictCode("");
      return;
    }

    const province = provinces.find((entry) => entry.code === Number(selectedProvinceCode));
    setDistricts(province?.districts ?? []);
    setSelectedDistrictCode((previous) => {
      if (!previous) {
        return "";
      }
      const match = province?.districts?.some((district) => district.code === Number(previous));
      return match ? previous : "";
    });
  }, [provinces, selectedProvinceCode]);

  const subtotal = useMemo(
    () =>
      cartItems.reduce(
        (accumulator, item) => accumulator + (typeof item.total === "number" ? item.total : item.unitPrice * item.quantity),
        0,
      ),
    [cartItems],
  );

  const totalAmount = useMemo(() => subtotal + freight, [freight, subtotal]);

  const selectedProvince = useMemo(
    () => provinces.find((entry) => entry.code === Number(selectedProvinceCode)),
    [provinces, selectedProvinceCode],
  );

  const selectedDistrict = useMemo(
    () => districts.find((entry) => entry.code === Number(selectedDistrictCode)),
    [districts, selectedDistrictCode],
  );

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }),
    [],
  );

  const handleSubmit = useCallback(async () => {
    if (!cartItems.length) {
      toast.error("Select items to checkout from your cart.");
      navigate("/cart", { replace: true });
      return;
    }

    if (specificAddress.trim().length === 0) {
      toast.error("Please enter the specific address.");
      return;
    }

    if (!selectedProvince || !selectedDistrict) {
      toast.error("Please choose province and district.");
      return;
    }

    if (selectedCartItemIds.length === 0) {
      toast.error("No items selected for checkout.");
      navigate("/cart", { replace: true });
      return;
    }

    const addressParts = [
      specificAddress.trim(),
      selectedDistrict.name,
      selectedProvince.name,
    ].filter(Boolean);

    const payload = {
      freight,
      totalAmount,
      cartItemIds: selectedCartItemIds,
      address: addressParts.join(", "),
      paymentMethod,
    };

    console.log("Submitting order", payload);
    setSubmitting(true);

    try {
      await ensureCartForStoredSession();
      const { data } = await axiosInstance.post<StandardResponse<OrderCreateResponse>>("/Order/create", payload);
      console.log("Order response", data);
      const responseBody: OrderCreateResponse | undefined = data?.data ?? (data as unknown as OrderCreateResponse | undefined);

      const succeeded = Boolean(
        data?.success ??
          responseBody?.isSuccess ??
          responseBody?.success ??
          typeof responseBody?.paymentUrl === "string",
      );

      if (succeeded) {
        toast.success("Order created successfully.");
        const paymentUrl =
          typeof responseBody?.paymentUrl === "string" && responseBody.paymentUrl.trim().length > 0
            ? responseBody.paymentUrl.trim()
            : "";
        if (paymentUrl) {
          window.location.assign(paymentUrl);
          return;
        }

        navigate("/payment/success", { replace: true });
        return;
      }

      toast.error((data?.message as string | undefined) ?? (responseBody?.message as string | undefined) ?? "Payment could not be completed.");
      navigate("/payment/cancel", { replace: true });
    } catch (error) {
      console.warn("Failed to create order:", error);
      toast.error("Unable to complete checkout.");
      navigate("/payment/cancel", { replace: true });
    } finally {
      setSubmitting(false);
    }
  }, [
    cartItems.length,
    freight,
    navigate,
    paymentMethod,
    selectedCartItemIds,
    selectedDistrict,
    selectedProvince,
    specificAddress,
    totalAmount,
  ]);

  if (!identity) {
    return <Navigate to="/login" replace />;
  }

  if (!selectedCartItemIds.length) {
    return <Navigate to="/cart" replace />;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="max-w-md rounded-3xl border border-slate-200 bg-white px-6 py-8 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-600">Preparing checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link to="/cart" className="text-sm font-semibold text-slate-600 transition hover:text-indigo-600">
            Back to cart
          </Link>
          <h1 className="text-lg font-semibold text-slate-900">Checkout</h1>
          <div className="text-sm font-semibold text-slate-900">Total: {currencyFormatter.format(totalAmount)}</div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Shipping information</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Province
              <select
                value={selectedProvinceCode}
                onChange={(event) => setSelectedProvinceCode(event.target.value === "" ? "" : Number(event.target.value))}
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <option value="">Choose province</option>
                {provinces.map((province) => (
                  <option key={province.code} value={province.code}>
                    {province.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              District
              <select
                value={selectedDistrictCode}
                onChange={(event) => setSelectedDistrictCode(event.target.value === "" ? "" : Number(event.target.value))}
                disabled={selectedProvinceCode === ""}
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="">Choose district</option>
                {districts.map((district) => (
                  <option key={district.code} value={district.code}>
                    {district.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Specific address
              <input
                type="text"
                value={specificAddress}
                onChange={(event) => setSpecificAddress(event.target.value)}
                placeholder="House number, street, building"
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </label>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Order summary</h2>
          <div className="mt-4 space-y-4">
            {cartItems.map((item) => (
              <div key={item.cartItemId} className="flex items-start justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.productName}</p>
                  <p className="text-xs text-slate-500">
                    Qty: {item.quantity} · {currencyFormatter.format(item.unitPrice)}
                  </p>
                </div>
                <p className="text-sm font-semibold text-slate-900">
                  {currencyFormatter.format(typeof item.total === "number" ? item.total : item.unitPrice * item.quantity)}
                </p>
              </div>
            ))}
          </div>
          <dl className="mt-6 space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <dt>Subtotal</dt>
              <dd className="text-base font-semibold text-slate-900">{currencyFormatter.format(subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Freight</dt>
              <dd>
                <input
                  type="number"
                  min={0}
                  value={freight}
                  onChange={(event) => setFreight(Math.max(0, Number(event.target.value) || 0))}
                  className="h-9 w-32 rounded-lg border border-slate-300 px-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Total amount</dt>
              <dd className="text-base font-semibold text-slate-900">{currencyFormatter.format(totalAmount)}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Payment method</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className={`flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition ${paymentMethod === 1 ? "border-indigo-400 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
              <span>Online payment</span>
              <input
                type="radio"
                name="paymentMethod"
                checked={paymentMethod === 1}
                onChange={() => setPaymentMethod(1)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
              />
            </label>
            <label className={`flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition ${paymentMethod === 2 ? "border-indigo-400 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
              <span>Cash on delivery</span>
              <input
                type="radio"
                name="paymentMethod"
                checked={paymentMethod === 2}
                onChange={() => setPaymentMethod(2)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
              />
            </label>
          </div>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link
            to="/cart"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600"
          >
            Back to cart
          </Link>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Processing..." : "Place order"}
          </button>
        </div>
      </main>
    </div>
  );
}

export default CheckoutPage;
