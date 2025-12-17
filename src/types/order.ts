export interface OrderDetailItem {
  orderDetailId: number;
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  discount: number;
  imageUrl: string;
  subTotalPrice: number;
  totalPrice: number;
}

export interface OrderSummary {
  orderId: number;
  memberId: string;
  orderDate: string;
  isPaid: boolean;
  paidAt: string | null;
  totalAmount: number;
  address: string;
  status: number;
  orderDetailItems: OrderDetailItem[];
}
