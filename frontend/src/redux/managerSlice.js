import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const getAuthHeader = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
  return { Authorization: `Bearer ${token}` };
};

export const fetchDashboardData = createAsyncThunk(
  'manager/fetchDashboardData',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('http://localhost:5000/api/manager/dashboard', {
        headers: getAuthHeader(),
      });
      if (response.data && response.data.success) {
        return response.data.data;
      } else {
        return rejectWithValue('Failed to load dashboard data');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Network error');
    }
  }
);

export const approveShop = createAsyncThunk(
  'manager/approveShop',
  async (shopId, { rejectWithValue }) => {
    try {
      const response = await axios.put(`http://localhost:5000/api/manager/shop-approval/${shopId}/approve`, {}, {
        headers: getAuthHeader(),
      });
      if (response.data && response.data.success) {
        return shopId;
      } else {
        return rejectWithValue('Failed to approve shop');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Network error');
    }
  }
);

export const rejectShop = createAsyncThunk(
  'manager/rejectShop',
  async ({ shopId, reason }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`http://localhost:5000/api/manager/shop-approval/${shopId}/reject`, { reason }, {
        headers: getAuthHeader(),
      });
      if (response.data && response.data.success) {
        return shopId;
      } else {
        return rejectWithValue('Failed to reject shop');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Network error');
    }
  }
);

const managerSlice = createSlice({
  name: 'manager',
  initialState: {
    stats: {},
    approvalTrends: [],
    pendingTasks: [],
    recentActivity: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.stats = action.payload.stats || {};
        state.approvalTrends = action.payload.approvalTrends || [];
        state.pendingTasks = action.payload.pendingTasks || [];
        state.recentActivity = action.payload.recentActivity || [];
        state.loading = false;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(approveShop.fulfilled, (state, action) => {
        state.pendingTasks = state.pendingTasks.filter(task => task.id !== action.payload || task.type !== 'shop');
      })
      .addCase(rejectShop.fulfilled, (state, action) => {
        state.pendingTasks = state.pendingTasks.filter(task => task.id !== action.payload || task.type !== 'shop');
      });
  },
});

export default managerSlice.reducer;
