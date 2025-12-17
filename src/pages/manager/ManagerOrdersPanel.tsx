import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import axiosInstance from "../../axios/instance";
import type { OrderDetailItem, OrderSummary } from "../../types/order";

const PAGE_SIZE = 2;

const STATUS_OPTIONS: Array<{ label: string; value: number }> = [
  { label: "Tất cả", value: 5 },
  { label: "Chờ xử lý", value: 0 },
  { label: "Đã thanh toán", value: 1 },
  { label: "Đang giao", value: 2 },
  { label: "Hoàn tất", value: 3 },
  { label: "Đã hủy", value: 4 },
];

interface ManagerOrder extends Pick<OrderSummary, "orderId" | "orderDate" | "isPaid" | "paidAt" | "totalAmount" | "address" | "status"> {
  memberId: string;
  orderDetailItems: OrderDetailItem[];
}

function ManagerOrdersPanel() {
  const [orders, setOrders] = useState<ManagerOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<number>(5);
  const [pageIndex, setPageIndex] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }),
    [],
  );

  const statusLabels = useMemo(
    () => ({
      0: "Chờ xử lý",
      1: "Đã thanh toán",
      2: "Đang giao",
      3: "Hoàn tất",
      4: "Đã hủy",
      5: "Tất cả",
    } satisfies Record<number, string>),
    [],
  );

  useEffect(() => {
    let isMounted = true;

    const fetchOrders = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await axiosInstance.get<OrderSummary[]>("/Order/all", {
          params: {
            status: statusFilter,
            pageIndex,
            pageSize: PAGE_SIZE,
          },
        });

        if (!isMounted) {
          return;
        }

        const data = Array.isArray(response.data) ? response.data : [];
        const normalized: ManagerOrder[] = data.map((order) => ({
          orderId: order.orderId,
          memberId: order.memberId,
          orderDate: order.orderDate,
          isPaid: order.isPaid,
          paidAt: order.paidAt ?? null,
          totalAmount: order.totalAmount,
          address: order.address,
          status: order.status,
          orderDetailItems: Array.isArray(order.orderDetailItems) ? order.orderDetailItems : [],
        }));

        setOrders(normalized);
        setHasMore(normalized.length === PAGE_SIZE);
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        setError("Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.");
        setOrders([]);
        setHasMore(false);
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
  }, [statusFilter, pageIndex]);

  const handleStatusChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextStatus = Number.parseInt(event.target.value, 10);
    setStatusFilter(Number.isNaN(nextStatus) ? 5 : nextStatus);
    setPageIndex(0);
  };

  const goToPreviousPage = () => {
    setPageIndex((previous) => Math.max(0, previous - 1));
  };

  const goToNextPage = () => {
    if (hasMore) {
      setPageIndex((previous) => previous + 1);
    }
  };

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
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Order</h2>
          <p className="text-sm text-slate-500">Xem và kiểm soát tất cả đơn hàng trong hệ thống.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="manager-status-filter">
            Trạng thái
          </label>
          <select
            id="manager-status-filter"
            value={statusFilter}
            onChange={handleStatusChange}
            className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-indigo-200 focus:border-indigo-400 focus:outline-none"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="mt-4 space-y-6">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: PAGE_SIZE }).map((_, index) => (
              <div key={`manager-order-skeleton-${index}`} className="animate-pulse rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="h-4 w-1/3 rounded bg-slate-200" />
                <div className="mt-3 h-4 w-1/4 rounded bg-slate-200" />
                <div className="mt-5 h-20 rounded bg-slate-200" />
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
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-600">
            Không có đơn hàng nào trong trạng thái này.
          </div>
        ) : null}

        {!loading && !error && orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order) => (
              <article key={order.orderId} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <header className="flex flex-col gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Đơn #{order.orderId}</h3>
                    <p className="text-xs text-slate-500">Khách hàng: {order.memberId}</p>
                    <p className="text-sm text-slate-500">Ngày tạo: {new Date(order.orderDate).toLocaleString("vi-VN")}</p>
                  </div>
                  <div className="flex flex-col items-start gap-2 text-sm text-slate-500 sm:items-end">
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      {statusLabels[order.status as keyof typeof statusLabels] ?? `Trạng thái ${order.status}`}
                    </span>
                    <span>Thanh toán: {order.isPaid ? "Đã thanh toán" : "Chưa thanh toán"}</span>
                    {order.paidAt ? (
                      <span className="text-xs text-slate-400">Thanh toán lúc {new Date(order.paidAt).toLocaleString("vi-VN")}</span>
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
              </article>
            ))}
          </div>
        ) : null}

        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <button
            type="button"
            onClick={goToPreviousPage}
            disabled={pageIndex === 0 || loading}
            className="rounded-full border border-slate-200 px-4 py-2 font-semibold transition hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Trang trước
          </button>
          <span className="text-xs uppercase tracking-wide text-slate-400">
            Trang {pageIndex + 1}
          </span>
          <button
            type="button"
            onClick={goToNextPage}
            disabled={!hasMore || loading}
            className="rounded-full border border-slate-200 px-4 py-2 font-semibold transition hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Trang tiếp
          </button>
        </div>
      </div>
    </section>
  );
}

export default ManagerOrdersPanel;
