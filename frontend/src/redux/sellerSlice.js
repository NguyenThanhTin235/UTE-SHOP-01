import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const getAuthHeader = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
  return { Authorization: `Bearer ${token}` };
};

export const fetchSellerWallet = createAsyncThunk(
  'seller/fetchSellerWallet',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('http://localhost:5000/api/seller/wallet', {
        headers: getAuthHeader()
      });
      if (response.data && response.data.success) {
        return response.data.data.total_balance ?? 0;
      } else {
        return rejectWithValue('Failed to load wallet balance');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Network error');
    }
  }
);

export const fetchShopStatus = createAsyncThunk(
  'seller/fetchShopStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('http://localhost:5000/api/seller/settings', {
        headers: getAuthHeader()
      });
      if (response.data && response.data.success) {
        if (!response.data.data) {
          return { status: 'not_created', reason: '' };
        } else {
          return { 
            status: response.data.data.status || 'pending', 
            reason: response.data.data.rejection_reason || '' 
          };
        }
      } else {
        return rejectWithValue('Failed to load shop status');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Network error');
    }
  }
);

const sellerSlice = createSlice({
  name: 'seller',
  initialState: {
    walletBalance: 0,
    shopStatus: 'loading', // loading, not_created, pending, active, rejected, error
    shopReason: '',
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSellerWallet.fulfilled, (state, action) => {
        state.walletBalance = action.payload;
      })
      .addCase(fetchShopStatus.pending, (state) => {
        state.shopStatus = 'loading';
      })
      .addCase(fetchShopStatus.fulfilled, (state, action) => {
        state.shopStatus = action.payload.status;
        state.shopReason = action.payload.reason;
      })
      .addCase(fetchShopStatus.rejected, (state, action) => {
        state.shopStatus = 'error';
        state.error = action.payload;
      });
  },
});

export default sellerSlice.reducer;
