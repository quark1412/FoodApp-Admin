import AsyncStorage from "@react-native-async-storage/async-storage";
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface CartState {
  items: any[];
}

const initialState: CartState = {
  items: [],
};

export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action) => {
      // const existingItem = state.items.find(
      //   (item) => item.id === action.payload.id
      // );
      // if (existingItem) {
      //   existingItem.quantity += action.payload.quantity;
      // } else {
      //   state.items.push(action.payload);
      // }

      const { productId, quantity, size } = action.payload;
      const indexProductId = state.items.findIndex(
        (item) => item.productId === productId && item.size === size
      );
      if (indexProductId >= 0) {
        state.items[indexProductId].quantity += quantity;
      } else {
        state.items.push({
          productId,
          quantity,
          size,
        });
      }
      AsyncStorage.setItem("carts", JSON.stringify(state.items));
    },
    mergeCart: (state, action) => {
      const guestCart = action.payload;
      guestCart.forEach((item: any) => {
        const indexProductId = state.items.findIndex(
          (cartItem) =>
            cartItem.productId === item.productId && cartItem.size === item.size
        );
        if (indexProductId >= 0) {
          state.items[indexProductId].quantity += item.quantity;
        } else {
          state.items.push(item);
        }
      });
      AsyncStorage.setItem("carts", JSON.stringify(state.items));
    },
    removeItem: (state, action) => {
      const { productId, size } = action.payload;
      state.items = state.items.filter(
        (item) => item.productId !== productId || item.size !== size
      );
      AsyncStorage.setItem("carts", JSON.stringify(state.items));
    },
    emptyCart: (state) => {
      state.items = [];
    },
    changeQuantity: (state, action) => {
      const { productId, quantity, size } = action.payload;
      const indexProductId = state.items.findIndex(
        (item) => item.productId === productId && item.size === size
      );
      if (quantity > 0) {
        state.items[indexProductId].quantity = quantity;
      }
      AsyncStorage.setItem("carts", JSON.stringify(state.items));
    },
    // increaseQuantity: (state, action: PayloadAction<string>) => {
    //   const item = state.items.find((item) => item.id === action.payload);
    //   if (item) {
    //     item.quantity += 1;
    //   }
    // },
    // decreaseQuantity: (state, action: PayloadAction<string>) => {
    //   const item = state.items.find((item) => item.id === action.payload);
    //   if (item && item.quantity > 1) {
    //     item.quantity -= 1;
    //   }
    // },
  },
});

export const {
  addToCart,
  mergeCart,
  removeItem,
  emptyCart,
  changeQuantity,
  // increaseQuantity,
  // decreaseQuantity,
} = cartSlice.actions;

export const selectCartItems = (state: any) => state.cart.items;
// export const selectCartItemsById = (state: any, id: string) =>
//   state.cart.items.filter((item: any) => item.id === id);
export const selectCartTotal = (state: any) =>
  state.cart.items.reduce(
    (total: number, item: any) => (total = total + item.price),
    0
  );

export default cartSlice.reducer;
