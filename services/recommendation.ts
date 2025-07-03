import instance from "@/configs/axiosConfig";

export const getRelatedProducts = async () => {
  try {
    const response = await instance.get("/recommendation", {
      requiresAuth: true,
    } as any);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};
