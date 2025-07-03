import instance from "@/configs/axiosConfig";

export const getAllReviews = async (
  isActive: number,
  status: string,
  rating: number,
  productId: string,
  userId: string,
  orderId: string
) => {
  try {
    const params = new URLSearchParams();

    if (isActive) {
      params.append("isActive", isActive.toString());
    }

    if (status) {
      params.append("status", status);
    }

    if (rating) {
      params.append("rating", rating.toString());
    }

    if (productId) {
      params.append("productId", productId);
    }

    if (userId) {
      params.append("userId", userId);
    }

    if (orderId) {
      params.append("orderId", orderId);
    }

    const response = await instance.get(`/review?${params.toString()}`, {
      requiresAuth: false,
    } as any);
    return response.data.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getReviewsByProductId = async (productId: string) => {
  try {
    const response = await instance.get(`/review/productId/${productId}`, {
      requiresAuth: false,
    } as any);
    return response.data.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getReviewById = async (id: string) => {
  try {
    const response = await instance.get(`/review/${id}`, {
      requiresAuth: false,
    } as any);
    return response.data.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getReviewByProductIdAndUserId = async (productId: string) => {
  try {
    const response = await instance.get(
      `/review/${productId}/productIdAndUserId`,
      { requiresAuth: false } as any
    );
    return response.data.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const createReview = async (
  productId: string,
  rating: number,
  content: string,
  orderId: string
) => {
  try {
    const response = await instance.post(
      "/review",
      {
        productId,
        rating,
        content,
        orderId,
      },
      { requiresAuth: true } as any
    );
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const hideReview = async (id: string) => {
  try {
    const response = await instance.put(`/review/hide/${id}`, {
      requiresAuth: true,
    } as any);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const unhideReview = async (id: string) => {
  try {
    const response = await instance.put(`/review/unhide/${id}`, {
      requiresAuth: true,
    } as any);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const updateReview = async (
  id: string,
  rating: number,
  content: string
) => {
  try {
    const response = await instance.put(
      `/review/${id}`,
      {
        rating: rating,
        content: content,
      },
      { requiresAuth: true } as any
    );
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const createReviewResponse = async (
  reviewId: string,
  content: string
) => {
  try {
    const response = await instance.post(
      "/review/response",
      {
        reviewId: reviewId,
        content: content,
      },
      { requiresAuth: true } as any
    );
    return response.data.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
