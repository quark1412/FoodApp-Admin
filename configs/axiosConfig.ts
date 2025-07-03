import axios, { InternalAxiosRequestConfig } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import dayjs from "dayjs";

const baseURL = process.env.EXPO_PUBLIC_BASE_URL;

const instance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  requiresAuth?: boolean;
}

instance.interceptors.request.use(
  async (
    req: CustomAxiosRequestConfig
  ): Promise<InternalAxiosRequestConfig> => {
    const accessToken = await AsyncStorage.getItem("accessToken");
    const refreshToken = await AsyncStorage.getItem("refreshToken");

    const requiresAuth = req.requiresAuth !== false;

    if (!requiresAuth) {
      return req;
    }

    if (!req.headers) {
      req.headers = axios.AxiosHeaders.from(req.headers || {});
    }

    if (accessToken) {
      try {
        const user: { exp: number } = jwtDecode(accessToken);
        const isExpired = dayjs.unix(user.exp).diff(dayjs()) < 1;

        if (!isExpired) {
          req.headers.Authorization = `Bearer ${accessToken}`;
          return req;
        }
      } catch (err) {
        console.warn("Invalid token:", err);
      }
    }

    try {
      const response = await axios.post(`${baseURL}/auth/refreshToken`, {
        refreshToken,
      });

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        response.data.data;

      await AsyncStorage.setItem("accessToken", newAccessToken);
      await AsyncStorage.setItem("refreshToken", newRefreshToken);

      req.headers.Authorization = `Bearer ${newAccessToken}`;
      return req;
    } catch (err) {
      console.log("Token refresh failed:", err);
      await AsyncStorage.removeItem("accessToken");
      await AsyncStorage.removeItem("refreshToken");
      return req;
    }
  }
);

export default instance;
