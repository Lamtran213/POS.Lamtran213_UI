import { Navigate } from "react-router-dom";
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
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="rounded-3xl border border-slate-200 bg-white px-8 py-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Manager dashboard</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Welcome back, {identity.fullName ?? identity.email}</h1>
          <p className="mt-3 text-sm text-slate-600">
            You have manager access. This area will host advanced controls for inventory, staff, and reports.
          </p>
        </header>
        <section className="grid gap-6 md:grid-cols-2">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Inventory status</h2>
            <p className="mt-2 text-sm text-slate-600">
              Integrate analytics here to monitor low-stock items and reorder points.
            </p>
          </article>
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Team performance</h2>
            <p className="mt-2 text-sm text-slate-600">
              Surface staff metrics, shifts, and productivity summaries for quick reviews.
            </p>
          </article>
        </section>
      </div>
    </div>
  );
}

export default ManagerPage;
