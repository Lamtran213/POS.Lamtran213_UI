import { Link, useSearchParams } from "react-router-dom";

function OrderSuccessPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-3xl border border-emerald-200 bg-white px-8 py-10 shadow-lg shadow-emerald-200/40">
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-600">
            Đặt hàng thành công
          </span>
          <h1 className="mt-4 text-3xl font-bold text-slate-900">Cảm ơn bạn đã đặt hàng!</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Đơn hàng của bạn đã được tạo thành công. POS.Lamtran213 sẽ liên hệ để xác nhận và tiến hành xử lý trong thời gian sớm nhất.
          </p>
          {orderId ? (
            <p className="mt-4 text-sm font-semibold text-slate-800">Mã đơn hàng: #{orderId}</p>
          ) : null}
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
              Xem đơn hàng của tôi
            </Link>
          </div>
          <p className="mt-6 text-xs text-slate-500">
            Nếu cần hỗ trợ thêm, vui lòng phản hồi email xác nhận hoặc liên hệ đội ngũ hỗ trợ với mã đơn hàng ở trên.
          </p>
        </div>
      </div>
    </div>
  );
}

export default OrderSuccessPage;
