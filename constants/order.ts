export const SHIPPING_FEE = 10000;
export const INITIAL_LOCATION = {
  latitude: 10.8231,
  longitude: 106.6297,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};
export const ORDER_STATUS = {
  PENDING: "Đang chờ",
  ACCEPTED: "Đã nhận đơn",
  PROCESSING: "Đang xử lý",
  IN_DELIVERY: "Đang giao",
  SHIPPED: "Đã giao",
  CANCELLED_BY_YOU: "Đã hủy bởi người mua",
  CANCELLED_BY_EMPLOYEE: "Đã hủy bởi người bán",
};
export const DELIVERY_RADIUS = 0.0001; // Approximately 1km in degrees
export const STEP_COMPLETION_RADIUS = 0.0001;

// User related constants
export const USER_STATUS = {
  ACTIVE: "Đang hoạt động",
  INACTIVE: "Ngưng hoạt động",
};

export const ROLE_NAME = [
  { key: "Admin", value: "Admin" },
  { key: "Employee", value: "Employee" },
  { key: "Customer", value: "Customer" },
];

export const ITEM_PER_PAGE = 10;
