import instance from "@/configs/axiosConfig";

export const getAllOrders = async (
  status?: string,
  paymentMethod?: string,
  paymentStatus?: string
) => {
  try {
    const params = new URLSearchParams();

    if (status) {
      params.append("status", status);
    }

    if (paymentMethod) {
      params.append("paymentMethod", paymentMethod);
    }

    if (paymentStatus) {
      params.append("paymentStatus", paymentStatus);
    }

    const response = await instance.get(`/order?${params.toString()}`, {
      requiresAuth: true,
    } as any);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const getOrderById = async (id: string) => {
  try {
    const response = await instance.get(`/order/${id}`, {
      requiresAuth: true,
    } as any);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const getOrderByUserId = async () => {
  try {
    const response = await instance.get("/order/get/userId", {
      requiresAuth: true,
    } as any);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const createOrder = async (
  orderItems: Object,
  discount: number,
  userAddressId: string,
  shippingFee: number,
  paymentMethod: string,
  deliveryInfo: Object,
  expectedDeliveryDate: any
) => {
  try {
    const response = await instance.post(
      "/order",
      {
        orderItems,
        discount,
        userAddressId,
        shippingFee,
        paymentMethod,
        deliveryInfo,
        expectedDeliveryDate,
      },
      { requiresAuth: true } as any
    );
    return response.data.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const updateDeliveryInfoById = async (
  orderId: string,
  status: string,
  deliveryAddress: string,
  expectedDeliveryDate: string
) => {
  try {
    const response = await instance.put(
      `/order/deliveryInfo/${orderId}`,
      {
        status,
        deliveryAddress,
        expectedDeliveryDate,
      },
      { requiresAuth: true } as any
    );
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const updatePaymentStatusById = async (
  orderId: string,
  paymentStatus: string
) => {
  try {
    const response = await instance.put(
      `/order/paymentStatus/${orderId}`,
      {
        paymentStatus,
      },
      { requiresAuth: true } as any
    );
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const sendMailDeliveryInfo = async (orderId: string, email: string) => {
  try {
    const response = await instance.post(
      `/order/sendDeliveryInfo`,
      {
        orderId,
        email,
      },
      { requiresAuth: false } as any
    );
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const getIncompleteOrders = async () => {
  try {
    const response = await instance.get("/order?status=Đang chờ", {
      requiresAuth: true,
    } as any);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};
