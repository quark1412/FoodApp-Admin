import instance from "@/configs/axiosConfig";

export const generateOTP = async (email: string) => {
  try {
    const response = await instance.post(
      "/auth/generateOTP",
      {
        email: email,
      },
      {
        requiresAuth: false,
      } as any
    );
    return response.data.otp;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const sendOTP = async (email: string, otp: string) => {
  try {
    const response = await instance.post(
      "/auth/sendOTP",
      {
        email: email,
        OTP: otp,
      },
      {
        requiresAuth: false,
      } as any
    );
    return response.data.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const verifyOTP = async (email: string, otp: string) => {
  try {
    const response = await instance.post(
      "/auth/checkOTPByEmail",
      {
        email: email,
        OTP: otp,
      },
      {
        requiresAuth: false,
      } as any
    );
    return response.data.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
