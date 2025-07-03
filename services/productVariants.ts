import instance from "@/configs/axiosConfig";

export const getProductVariantsByProductId = async (productId: string) => {
  try {
    const response = await instance.get(
      `/productVariant/productId/${productId}`,
      { requiresAuth: false } as any
    );
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const getProductVariantById = async (id: string) => {
  try {
    const response = await instance.get(`/productVariant/${id}`, {
      requiresAuth: false,
    } as any);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const getProductVariantByProductInfo = async (
  productId: string,
  size: string
) => {
  try {
    const response = await instance.get(
      `/productVariant/get/productInfo?productId=${productId}&&size=${size}`,
      { requiresAuth: false } as any
    );
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const createProductVariant = async (
  productId: string,
  size: string,
  quantity: number
) => {
  try {
    const response = await instance.post(
      "/productVariant",
      {
        productId: productId,
        size: size,
        stock: quantity,
      },
      { requiresAuth: true } as any
    );
    return response.data.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const updateProductVariant = async (
  id: string,
  productId: string,
  size: string,
  quantity: number
) => {
  try {
    const response = await instance.put(
      `/productVariant/${id}`,
      {
        productId: productId,
        size: size,
        stock: quantity,
      },
      { requiresAuth: true } as any
    );
    return response.data.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const deleteProductVariant = async (id: string) => {
  try {
    const response = await instance.delete(`/productVariant/${id}`, {
      requiresAuth: true,
    } as any);
    return response.data.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
