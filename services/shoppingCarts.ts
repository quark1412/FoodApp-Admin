import instance from "@/configs/axiosConfig";

export const getShoppingCartByUserId = async () => {
  try {
    const response = await instance.get("/shoppingCart", {
      requiresAuth: true,
    } as any);
    return response.data.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getShoppingCartById = async (id: string) => {
  try {
    const response = await instance.get(`/shoppingCart/${id}`, {
      requiresAuth: true,
    } as any);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const createShoppingCart = async (
  productVariantId: string,
  quantity: number
) => {
  try {
    const response = await instance.post(
      "/shoppingCart",
      {
        productVariantId: productVariantId,
        quantity: quantity,
      },
      { requiresAuth: true } as any
    );
    return response.data.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const updateShoppingCartQuantityById = async (
  id: string,
  quantity: number
) => {
  try {
    const response = await instance.put(
      `/shoppingCart/${id}`,
      {
        quantity: quantity,
      },
      {
        requiresAuth: true,
      } as any
    );
    return response.data.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const deleteShoppingCartById = async (id: string) => {
  try {
    const response = await instance.delete(`/shoppingCart/${id}`, {
      requiresAuth: true,
    } as any);
    return response.data.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
