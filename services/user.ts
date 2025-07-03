import instance from "@/configs/axiosConfig";

export const getUserById = async (userId: string) => {
  try {
    const response = await instance.get(`/user/${userId}`, {
      requiresAuth: true,
    } as any);
    return response.data.data;
  } catch (error) {
    console.log("Error fetching user by ID:", error);
    throw error;
  }
};

export const getAllUsers = async () => {
  try {
    const response = await instance.get("/user", {
      requiresAuth: true,
    } as any);
    return response.data.data;
  } catch (error) {
    console.log("Error fetching all users:", error);
    throw error;
  }
};

export const createUser = async (
  email: string,
  fullName: string,
  phone: string,
  password: string,
  userRole: string
) => {
  try {
    console.log(email, fullName, phone, password, userRole);
    const response = await instance.post(
      "/user",
      {
        email,
        fullName,
        phone,
        password,
        roleId: userRole,
      },
      {
        requiresAuth: true,
      } as any
    );
    return response.data.data;
  } catch (error) {
    console.log("Error creating user:", error);
    throw error;
  }
};

export const updateUserById = async (userId: string, userData: any) => {
  try {
    const response = await instance.put(`/user/${userId}`, userData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      requiresAuth: true,
    } as any);
    return response.data.data;
  } catch (error) {
    console.log("Error updating user by ID:", error);
    throw error;
  }
};

export const archiveUserById = async (userId: string) => {
  try {
    const response = await instance.put(`/user/${userId}/archive`, {}, {
      requiresAuth: true,
    } as any);
    return response.data.data;
  } catch (error) {
    console.log("Error archiving user:", error);
    throw error;
  }
};

export const getAllUserRoles = async () => {
  try {
    const response = await instance.get("/userRole", {
      requiresAuth: true,
    } as any);
    return response.data.data;
  } catch (error) {
    console.log("Error fetching user roles:", error);
    throw error;
  }
};

export const getUserRoleById = async (roleId: string) => {
  try {
    const response = await instance.get(`/userRole/${roleId}`, {
      requiresAuth: true,
    } as any);
    return response.data.data;
  } catch (error) {
    console.log("Error fetching user role by ID:", error);
    throw error;
  }
};
