import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import axiosInstance from "../../axios/instance";
import { useIdentity } from "../../lib/useIdentity";
import type { StandardResponse } from "../../types/auth";
import type { ProductItem, ProductListResponse } from "../../types/product";

const PAGE_SIZE = 10;

interface ManagerProduct extends Pick<ProductItem, "productId" | "productName" | "description" | "unitPrice" | "imageUrl"> {
  categoryId: number | null;
}

interface CreatedProductPayload {
  productId: number;
  productName: string;
  description?: string | null;
  unitPrice: number;
  unitsInStock: number;
  categoryId: number | null;
  imageUrl?: string | null;
  discount: number;
  isActive: boolean;
}

function ManagerProductsPage() {
  const identity = useIdentity();
  const [products, setProducts] = useState<ManagerProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [categoryIdInput, setCategoryIdInput] = useState("");
  const [productNameInput, setProductNameInput] = useState("");
  const [unitPriceInput, setUnitPriceInput] = useState("");
  const [unitsInStockInput, setUnitsInStockInput] = useState("");
  const [discountInput, setDiscountInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  if (!identity) {
    return <Navigate to="/login" replace />;
  }

  if (identity.role !== "Manager") {
    return <Navigate to="/" replace />;
  }

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }),
    [],
  );

  const loadProducts = useCallback(async (requestedPageIndex: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.get<ProductListResponse>("/Product", {
        params: {
          pageIndex: requestedPageIndex,
          pageSize: PAGE_SIZE,
        },
      });

      if (!response.data.success) {
        setError(response.data.message ?? "Không thể tải danh sách sản phẩm.");
        setProducts([]);
        setTotalItems(0);
        setTotalPages(1);
        return;
      }

      const payload = response.data.data;
      const items = Array.isArray(payload?.items) ? payload.items : [];

      const normalized: ManagerProduct[] = items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        description: item.description,
        unitPrice: item.unitPrice,
        categoryId: typeof item.categoryId === "number" ? item.categoryId : null,
        imageUrl: item.imageUrl,
      }));

      const derivedTotalPages = payload?.totalPages && payload.totalPages > 0 ? payload.totalPages : 1;

      setProducts(normalized);
      setTotalItems(payload?.totalItems ?? normalized.length);
      setTotalPages(derivedTotalPages);

      if (requestedPageIndex > derivedTotalPages) {
        setPageIndex(derivedTotalPages);
      }
    } catch (requestError) {
      setError("Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.");
      setProducts([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts(pageIndex);
  }, [pageIndex, loadProducts]);

  const goToPreviousPage = () => {
    setPageIndex((previous) => Math.max(1, previous - 1));
  };

  const goToNextPage = () => {
    setPageIndex((previous) => (previous < totalPages ? previous + 1 : previous));
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setImageFile(event.target.files?.[0] ?? null);
  };

  const resetForm = () => {
    setCategoryIdInput("");
    setProductNameInput("");
    setUnitPriceInput("");
    setUnitsInStockInput("");
    setDiscountInput("");
    setDescriptionInput("");
    setIsActive(true);
    setImageFile(null);
    setFileInputKey((previous) => previous + 1);
  };

  const handleAddProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!productNameInput.trim()) {
      toast.error("Vui lòng nhập tên sản phẩm.");
      return;
    }

    const priceValue = Number(unitPriceInput);
    if (!Number.isFinite(priceValue) || priceValue <= 0) {
      toast.error("Giá bán phải lớn hơn 0.");
      return;
    }

    const stockValue = Number.parseInt(unitsInStockInput, 10);
    if (Number.isNaN(stockValue) || stockValue < 0) {
      toast.error("Tồn kho phải từ 0 trở lên.");
      return;
    }

    const discountValue = discountInput.trim().length > 0 ? Number(discountInput) : 0;
    if (!Number.isFinite(discountValue) || discountValue < 0) {
      toast.error("Giảm giá không hợp lệ.");
      return;
    }

    const formData = new FormData();
    if (categoryIdInput.trim()) {
      formData.append("CategoryId", categoryIdInput.trim());
    }
    formData.append("ProductName", productNameInput.trim());
    formData.append("UnitPrice", priceValue.toString());
    formData.append("UnitsInStock", stockValue.toString());
    formData.append("Discount", discountValue.toString());
    formData.append("IsActive", isActive ? "true" : "false");
    formData.append("Description", descriptionInput.trim());
    if (imageFile) {
      formData.append("ImageUrl", imageFile);
    }

    setSubmitting(true);

    try {
      const response = await axiosInstance.post<StandardResponse<CreatedProductPayload>>("/Product", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (!response.data?.success) {
        toast.error(response.data?.message ?? "Không thể thêm sản phẩm.");
        return;
      }

      toast.success(response.data.message ?? "Thêm sản phẩm thành công.");

      resetForm();

      if (pageIndex === 1) {
        await loadProducts(1);
      } else {
        setPageIndex(1);
      }
    } catch (requestError) {
      toast.error("Không thể thêm sản phẩm. Vui lòng thử lại sau.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Manager Products</p>
          <h1 className="text-3xl font-bold text-slate-900">Danh sách sản phẩm</h1>
          <p className="text-sm text-slate-600">Theo dõi kho sản phẩm với phân trang 10 mục mỗi lần.</p>
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-semibold text-slate-900">Thêm sản phẩm mới</h2>
            <p className="mt-1 text-sm text-slate-600">Nhập thông tin chi tiết và tải ảnh để tạo sản phẩm.</p>
          </header>

          <form onSubmit={handleAddProduct} className="mt-4 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="manager-product-name">
                  Tên sản phẩm
                </label>
                <input
                  id="manager-product-name"
                  type="text"
                  value={productNameInput}
                  onChange={(event) => setProductNameInput(event.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="Nhập tên sản phẩm"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="manager-product-category">
                  Mã danh mục
                </label>
                <input
                  id="manager-product-category"
                  type="number"
                  value={categoryIdInput}
                  onChange={(event) => setCategoryIdInput(event.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="VD: 1"
                  min={0}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="manager-product-price">
                  Giá bán (VND)
                </label>
                <input
                  id="manager-product-price"
                  type="number"
                  value={unitPriceInput}
                  onChange={(event) => setUnitPriceInput(event.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="Nhập giá bán"
                  min={0}
                  step="1000"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="manager-product-stock">
                  Số lượng tồn
                </label>
                <input
                  id="manager-product-stock"
                  type="number"
                  value={unitsInStockInput}
                  onChange={(event) => setUnitsInStockInput(event.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="Nhập số lượng"
                  min={0}
                  step="1"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="manager-product-discount">
                  Giảm giá (0 - 1)
                </label>
                <input
                  id="manager-product-discount"
                  type="number"
                  value={discountInput}
                  onChange={(event) => setDiscountInput(event.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="Ví dụ: 0.1"
                  min={0}
                  max={1}
                  step="0.01"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="manager-product-image">
                  Ảnh sản phẩm
                </label>
                <input
                  key={fileInputKey}
                  id="manager-product-image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm file:mr-3 file:rounded-lg file:border-none file:bg-indigo-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-indigo-600 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700" htmlFor="manager-product-description">
                Mô tả
              </label>
              <textarea
                id="manager-product-description"
                value={descriptionInput}
                onChange={(event) => setDescriptionInput(event.target.value)}
                className="min-h-[120px] rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                placeholder="Nhập mô tả chi tiết sản phẩm"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                id="manager-product-active"
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label className="text-sm font-medium text-slate-700" htmlFor="manager-product-active">
                Sản phẩm đang kích hoạt
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Đang thêm..." : "Thêm sản phẩm"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                disabled={submitting}
                className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Xóa dữ liệu
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Trang {pageIndex} / {totalPages}
              </h2>
              <p className="text-sm text-slate-500">Tổng số sản phẩm: {totalItems}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={goToPreviousPage}
                disabled={pageIndex === 1 || loading}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold transition hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Trang trước
              </button>
              <button
                type="button"
                onClick={goToNextPage}
                disabled={pageIndex >= totalPages || loading}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold transition hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Trang tiếp
              </button>
            </div>
          </header>

          <div className="mt-4 space-y-4">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={`manager-product-skeleton-${index}`}
                    className="animate-pulse rounded-2xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="h-4 w-1/3 rounded bg-slate-200" />
                    <div className="mt-3 h-4 w-2/3 rounded bg-slate-200" />
                    <div className="mt-4 h-20 rounded bg-slate-200" />
                  </div>
                ))}
              </div>
            ) : null}

            {!loading && error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-8 text-center text-sm font-semibold text-rose-600">
                {error}
              </div>
            ) : null}

            {!loading && !error && products.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-600">
                Chưa có sản phẩm nào.
              </div>
            ) : null}

            {!loading && !error && products.length > 0 ? (
              <div className="grid gap-4">
                {products.map((product) => (
                  <article
                    key={product.productId}
                    className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row"
                  >
                    <div className="flex items-center justify-center md:w-40">
                      <div className="h-28 w-28 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                        <img src={product.imageUrl} alt={product.productName} className="h-full w-full object-cover" />
                      </div>
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-base font-semibold text-slate-900">{product.productName}</h3>
                        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-600">
                          Danh mục #{product.categoryId ?? "?"}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-slate-600">{product.description}</p>
                      <p className="text-sm font-semibold text-slate-900">
                        Giá bán: {currencyFormatter.format(product.unitPrice)}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

export default ManagerProductsPage;
