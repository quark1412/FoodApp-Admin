export interface Order {
  _id: string;
  orderItems: Array<{
    productId: string;
    quantity: number;
    size: string;
  }>;
  finalPrice: number;
  shippingFee: number;
  discount: number;
  paymentMethod: string;
  userAddressId: string;
  deliveryInfo: Array<{
    status: string;
    deliveryAddress: string;
    deliveryDate: Date;
  }>;
  expectedDeliveryDate: Date;
  userInfo: {
    fullName: string;
    email: string;
  };
  createdAt: string;
}
