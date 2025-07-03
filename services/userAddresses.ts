import instance from "@/configs/axiosConfig";

export const createUserAddress = async (
  city: string,
  district: string,
  commune: string,
  street: string,
  phone: string
) => {
  try {
    const response = await instance.post(
      `/userAddress`,
      {
        city,
        district,
        commune,
        street,
        phone,
      },
      { requiresAuth: true } as any
    );
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const getUserAddressById = async (id: string) => {
  try {
    const response = await instance.get(`/userAddress/${id}`, {
      requiresAuth: true,
    } as any);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const getUserAddressByUserId = async () => {
  try {
    const response = await instance.get("/userAddress?limit=50", {
      requiresAuth: true,
    } as any);
    return response.data.meta.data;
  } catch (error) {
    throw error;
  }
};

export const updateUserAddressById = async (
  id: string,
  city: string,
  district: string,
  commune: string,
  street: string,
  phone: string
) => {
  try {
    const response = await instance.put(
      `/userAddress/${id}`,
      { city, district, commune, street, phone },
      { requiresAuth: true } as any
    );
    return response.data.data;
  } catch (error) {
    throw error;
  }
};
