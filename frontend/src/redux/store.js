import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import uiReducer from './uiSlice';
import cartReducer from './cartSlice';
import managerReducer from './managerSlice';
import notificationReducer from './notificationSlice';
import productReducer from './productSlice';
import sellerReducer from './sellerSlice';
import adminReducer from './adminSlice';
import shipperReducer from './shipperSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    cart: cartReducer,
    manager: managerReducer,
    notifications: notificationReducer,
    products: productReducer,
    seller: sellerReducer,
    admin: adminReducer,
    shipper: shipperReducer,
  },
});


