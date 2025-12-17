import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../../axios/instance";
import { useIdentity } from "../../lib/useIdentity";
import type { OrderDetailItem, OrderSummary } from "../../types/order";

interface SimplifiedOrder extends Pick<OrderSummary, "orderId" | "orderDate" | "isPaid" | "paidAt" | "totalAmount" | "address" | "status"> {
  orderDetailItems: OrderDetailItem[];
}

function UserOrdersPage() {
  const navigate = useNavigate();
  const identity = useIdentity();
  const [orders, setOrders] = useState<SimplifiedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }),
    [],
  );

  const statusLabels = useMemo(
    () => ({
      0: "Đang xử lý",
      1: "Hoàn tất",
      2: "Đã hủy",
    } satisfies Record<number, string>),
    [],
  );

  useEffect(() => {
    if (identity === null) {
      navigate("/login", { replace: true });
    }
  }, [identity, navigate]);

  useEffect(() => {
    if (!identity) {
      return;
    }

    let isMounted = true;

    const fetchOrders = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await axiosInstance.get<OrderSummary[]>("/Order/orders-by-user");
        const rawOrders = Array.isArray(response.data) ? response.data : [];

        const normalizedOrders: SimplifiedOrder[] = rawOrders.map((order) => ({
          orderId: order.orderId,
          orderDate: order.orderDate,
          isPaid: order.isPaid,
          paidAt: order.paidAt ?? null,
          totalAmount: order.totalAmount,
          address: order.address,
          status: order.status,
          orderDetailItems: Array.isArray(order.orderDetailItems)
            ? order.orderDetailItems.map((item) => ({
                orderDetailId: item.orderDetailId,
                productId: item.productId,
                productName: item.productName,
                unitPrice: item.unitPrice,
                quantity: item.quantity,
                discount: item.discount,
                imageUrl: item.imageUrl,
                subTotalPrice: item.subTotalPrice,
                totalPrice: item.totalPrice,
              }))
            : [],
        }));

        if (!isMounted) {
          return;
        }

        setOrders(normalizedOrders);
      } catch (requestError) {
        if (!isMounted) {
          return;
        }
        setError("Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.");
        setOrders([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchOrders();

    return () => {
      isMounted = false;
    };
  }, [identity]);

  if (!identity) {
    return null;
  }

  const renderOrderItems = (items: OrderDetailItem[]) => {
    if (items.length === 0) {
      return (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          Đơn hàng chưa có sản phẩm.
        </div>
      );
    }

    return (
      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.orderDetailId}
            className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.productName}</p>
                <p className="text-xs text-slate-500">
                  Số lượng: {item.quantity} × {currencyFormatter.format(item.unitPrice)}
                </p>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-1 text-sm text-slate-600 sm:items-end">
              <span>Giảm giá: {(item.discount * 100).toFixed(0)}%</span>
              <span>Tạm tính: {currencyFormatter.format(item.subTotalPrice)}</span>
              <span className="font-semibold text-slate-900">Thành tiền: {currencyFormatter.format(item.totalPrice)}</span>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Đơn hàng của tôi</h1>
            <p className="mt-1 text-sm text-slate-500">Theo dõi trạng thái và chi tiết các đơn hàng gần đây.</p>
          </div>
          <Link
            to="/"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600"
          >
            Quay lại trang chủ
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-10">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={`order-skeleton-${index}`} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6">
                <div className="h-4 w-1/3 rounded bg-slate-200" />
                <div className="mt-4 h-4 w-1/4 rounded bg-slate-200" />
                <div className="mt-6 h-24 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        ) : null}

        {!loading && error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-8 text-center text-sm font-semibold text-rose-600">
            {error}
          </div>
        ) : null}

        {!loading && !error && orders.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center">
            <h2 className="text-lg font-semibold text-slate-900">Bạn chưa có đơn hàng nào.</h2>
            <p className="mt-2 text-sm text-slate-500">Bắt đầu mua sắm để tạo đơn hàng mới.</p>
            <Link
              to="/"
              className="mt-4 inline-flex rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Xem sản phẩm
            </Link>
          </div>
        ) : null}

        {!loading && !error && orders.length > 0 ? (
          <div className="space-y-8">
            {orders.map((order) => (
              <section key={order.orderId} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <header className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Đơn #{order.orderId}</h2>
                    <p className="text-sm text-slate-500">Ngày tạo: {new Date(order.orderDate).toLocaleString("vi-VN")}</p>
                  </div>
                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      {statusLabels[order.status] ?? `Trạng thái ${order.status}`}
                    </span>
                    <span className="text-sm text-slate-500">
                      Thanh toán: {order.isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
                    </span>
                    {order.paidAt ? (
                      <span className="text-xs text-slate-400">Đã thanh toán lúc {new Date(order.paidAt).toLocaleString("vi-VN")}</span>
                    ) : null}
                  </div>
                </header>

                <div className="mt-4 space-y-6">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <p className="font-semibold text-slate-800">Địa chỉ nhận hàng</p>
                    <p className="mt-1 text-slate-600">{order.address}</p>
                    <p className="mt-2 font-semibold text-slate-800">
                      Tổng cộng: {currencyFormatter.format(order.totalAmount)}
                    </p>
                  </div>

                  {renderOrderItems(order.orderDetailItems)}
                </div>
              </section>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default UserOrdersPage;
