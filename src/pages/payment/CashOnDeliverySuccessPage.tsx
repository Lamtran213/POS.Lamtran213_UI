import { Link } from "react-router-dom";

function CashOnDeliverySuccessPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-3xl border border-indigo-200 bg-white px-8 py-10 shadow-lg shadow-indigo-200/40">
          <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-600">
            Đặt hàng thành công
          </span>
          <h1 className="mt-4 text-3xl font-bold text-slate-900">Bạn đã đặt hàng thành công</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Bạn đã đặt hàng thành công, vui lòng đợi POS.Lamtran213 xác nhận nhé. Chúng tôi sẽ gửi thông báo ngay khi đơn hàng được tiếp nhận và chuẩn bị giao.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Tiếp tục mua sắm
            </Link>
            <Link
              to="/orders"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600"
            >
              Xem đơn hàng
            </Link>
          </div>
          <p className="mt-6 text-xs text-slate-500">
            Cần hỗ trợ? Liên hệ đội ngũ POS.Lamtran213 với mã đơn hàng được gửi qua email của bạn.
          </p>
        </div>
      </div>
    </div>
  );
}

export default CashOnDeliverySuccessPage;
