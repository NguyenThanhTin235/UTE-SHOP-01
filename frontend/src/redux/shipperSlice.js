import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const getAuthHeader = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
  return { Authorization: `Bearer ${token}` };
};

export const fetchShipperDashboard = createAsyncThunk(
  'shipper/fetchShipperDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const headers = getAuthHeader();
      const [dashboardRes, ordersRes, statsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/shipper/dashboard', { headers }),
        axios.get('http://localhost:5000/api/shipper/orders?limit=5', { headers }),
        axios.get('http://localhost:5000/api/shipper/statistics?timeframe=week', { headers })
      ]);

      return {
        stats: dashboardRes.data.success ? dashboardRes.data.data : null,
        recentOrders: ordersRes.data.success ? ordersRes.data.data.orders : [],
        performanceData: statsRes.data.success ? statsRes.data.data.chartData : []
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Network error');
    }
  }
);

const shipperSlice = createSlice({
  name: 'shipper',
  initialState: {
    stats: {
      totalAssigned: 0,
      inTransit: 0,
      delivered: 0,
      failed: 0,
      todayDelivered: 0
    },
    recentOrders: [],
    performanceData: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchShipperDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchShipperDashboard.fulfilled, (state, action) => {
        if (action.payload.stats) state.stats = action.payload.stats;
        if (action.payload.recentOrders) state.recentOrders = action.payload.recentOrders;
        if (action.payload.performanceData) state.performanceData = action.payload.performanceData;
        state.loading = false;
      })
      .addCase(fetchShipperDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default shipperSlice.reducer;
