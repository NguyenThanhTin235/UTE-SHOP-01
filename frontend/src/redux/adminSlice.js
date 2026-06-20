import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const getAuthHeader = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
  return { Authorization: `Bearer ${token}` };
};

export const fetchAdminDashboardData = createAsyncThunk(
  'admin/fetchAdminDashboardData',
  async (days, { rejectWithValue }) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/admin/dashboard?days=${days}`, {
        headers: getAuthHeader()
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

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    dashboardData: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminDashboardData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminDashboardData.fulfilled, (state, action) => {
        state.dashboardData = action.payload;
        state.loading = false;
      })
      .addCase(fetchAdminDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default adminSlice.reducer;
