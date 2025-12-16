export type ProductItem = {
	productId: number;
	productName: string;
	description: string;
	unitPrice: number;
	imageUrl: string;
};

export type ProductListPayload = {
	items: ProductItem[];
	pageIndex: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
};

export type ProductListResponse = {
	success: boolean;
	message?: string;
	data?: ProductListPayload;
};
