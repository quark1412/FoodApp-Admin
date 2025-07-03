import instance from "@/configs/axiosConfig";

export const getAllProducts = async (
  isActive?: number,
  search?: string,
  minPrice?: number,
  maxPrice?: number,
  sortName?: string
) => {
  try {
    const params = new URLSearchParams();
    if (isActive === 1 || isActive === 0) {
      params.append("isActive", isActive.toString());
    }

    // if (categoryId) {
    //   params.append("categoryId", categoryId);
    // }

    if (search) {
      params.append("search", search);
    }

    // if (page) {
    //   params.append("page", page);
    // }

    // if (limit) {
    //   params.append("limit", limit);
    // }

    if (minPrice) {
      params.append("minPrice", minPrice.toString());
    }

    if (maxPrice) {
      params.append("maxPrice", maxPrice.toString());
    }

    if (sortName) {
      params.append("sortName", sortName);
    }
    const response = await instance.get(`/product?${params.toString()}`, {
      requiresAuth: false,
    } as any);
    return response.data.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getNewArrivalProducts = async () => {
  try {
    const response = await instance.get(
      "/product?sortBy=createdAt&sortOrder=desc",
      { requiresAuth: false } as any
    );
    return response.data.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getBestSellerProducts = async () => {
  try {
    const response = await instance.get(
      "/product?sortBy=soldQuantity&sortOrder=desc",
      { requiresAuth: false } as any
    );
    return response.data.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getProductById = async (productId: string) => {
  try {
    const response = await instance.get(`/product/${productId}`, {
      requiresAuth: false,
    } as any);
    return response.data.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const createProduct = async (
  name: string,
  description: string,
  categoryId: string,
  price: number,
  rating = 0
) => {
  try {
    const response = await instance.post(
      "/product",
      {
        name: name,
        description: description,
        categoryId: categoryId,
        price: price,
        rating: rating,
      },
      { requiresAuth: true } as any
    );
    return response.data.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const createProductImages = async (productId: string, images: any) => {
  try {
    const formData = new FormData();
    formData.append("productId", productId);

    images.forEach((image: any) => {
      if (image.imageFile) {
        formData.append("images", image.imageFile);
      }
    });

    const response = await instance.post("/product/images", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      requiresAuth: true,
    } as any);

    return response.data.data;
  } catch (error) {
    console.log("Error uploading images:", error);
    throw error;
  }
};

export const deleteProductImageById = async (
  productId: string,
  publicId: string
) => {
  try {
    const response = await instance.delete(
      `/product/images/${productId}/${publicId}`,
      { requiresAuth: true } as any
    );
    return response.data.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const updateProduct = async (
  productId: string,
  name: string,
  description: string,
  categoryId: string,
  price: number,
  rating = 0
) => {
  try {
    const response = await instance.put(
      `/product/${productId}`,
      {
        name: name,
        description: description,
        categoryId: categoryId,
        price: price,
        rating: rating,
      },
      { requiresAuth: true } as any
    );
    return response.data.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const archiveProductById = async (id: string) => {
  try {
    const response = await instance.put(`/product/archive/${id}`, {
      requiresAuth: true,
    } as any);
    return response.data.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
