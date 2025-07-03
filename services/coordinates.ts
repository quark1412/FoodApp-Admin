import instance from "@/configs/axiosConfig";

export const getCoordinateByOrderId = async (orderId: string) => {
  try {
    const response = await instance.get(`/coordinate/order/${orderId}`, {
      requiresAuth: true,
    } as any);
    return response.data.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const createCoordinate = async (
  latitude: number,
  longitude: number,
  orderId: string
) => {
  try {
    const response = await instance.post(
      `/coordinate`,
      {
        latitude,
        longitude,
        orderId,
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

export const updateCoordinateById = async (
  id: string,
  latitude: number,
  longitude: number
) => {
  try {
    const response = await instance.put(
      `/coordinate/${id}`,
      {
        latitude,
        longitude,
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
