import instance from "@/configs/axiosConfig";

export const getStatistics = async (
  day?: number,
  month?: number,
  year?: number
) => {
  try {
    const params = new URLSearchParams();

    if (day) {
      params.append("day", day.toString());
    }

    if (month) {
      params.append("month", month.toString());
    }

    if (year) {
      params.append("year", year.toString());
    }

    const response = await instance.get(`/statistic?${params.toString()}`, {
      requiresAuth: true,
    } as any);
    return response.data.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
