import instance from "@/configs/axiosConfig";

export const getAllCategories = async () => {
  try {
    const response = await instance.get("/category", {
      requiresAuth: false,
    } as any);
    return response.data.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getCategoryById = async (id: string) => {
  try {
    const response = await instance.get(`/category/${id}`, {
      requiresAuth: false,
    } as any);
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const createCategory = async (category: string) => {
  try {
    const response = await instance.post("/category", { name: category }, {
      requiresAuth: true,
    } as any);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const updateCategory = async (id: string, name: string) => {
  try {
    const response = await instance.put(`/category/${id}`, { name: name }, {
      requiresAuth: true,
    } as any);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const updateStatusCategoryById = async (id: string) => {
  try {
    const response = await instance.put(`/category/archive/${id}`, {
      requiresAuth: true,
    });
    return response.data.data;
  } catch (error) {
    throw error;
  }
};
