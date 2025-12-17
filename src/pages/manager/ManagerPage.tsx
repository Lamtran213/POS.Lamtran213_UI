import { Link, Navigate } from "react-router-dom";
import { useIdentity } from "../../lib/useIdentity";

function ManagerPage() {
  const identity = useIdentity();

  if (!identity) {
    return <Navigate to="/login" replace />;
  }

  if (identity.role !== "Manager") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="rounded-3xl border border-slate-200 bg-white px-8 py-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Manager dashboard</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Welcome back, {identity.fullName ?? identity.email}</h1>
          <p className="mt-3 text-sm text-slate-600">
            Sử dụng các liên kết bên dưới để quản lý đơn hàng và sản phẩm.
          </p>
        </header>
        <section className="grid gap-6 md:grid-cols-2">
          <Link
            to="/manager/orders"
            className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md"
          >
            <h2 className="text-lg font-semibold text-slate-900">Quản lý đơn hàng</h2>
            <p className="mt-2 text-sm text-slate-600">
              Xem toàn bộ đơn hàng, lọc theo trạng thái và kiểm tra chi tiết từng mục.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
              Đi tới đơn hàng
              <span aria-hidden="true">-&gt;</span>
            </span>
          </Link>
          <Link
            to="/manager/products"
            className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md"
          >
            <h2 className="text-lg font-semibold text-slate-900">Quản lý sản phẩm</h2>
            <p className="mt-2 text-sm text-slate-600">
              Duyệt danh sách sản phẩm với phân trang 10 mục, xem mô tả và giá bán.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
              Đi tới sản phẩm
              <span aria-hidden="true">-&gt;</span>
            </span>
          </Link>
        </section>
      </div>
    </div>
  );
}

export default ManagerPage;
