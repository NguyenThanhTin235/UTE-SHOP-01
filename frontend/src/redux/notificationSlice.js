import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const getAuthHeader = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
  return { Authorization: `Bearer ${token}` };
};

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('http://localhost:5000/api/notifications', {
        headers: getAuthHeader(),
      });
      if (response.data && response.data.success) {
        return response.data.data;
      } else {
        return rejectWithValue('Failed to load notifications');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Network error');
    }
  }
);

export const markAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      const response = await axios.put(`http://localhost:5000/api/notifications/${notificationId}/read`, {}, {
        headers: getAuthHeader(),
      });
      if (response.data && response.data.success) {
        return notificationId;
      } else {
        return rejectWithValue('Failed to mark notification as read');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Network error');
    }
  }
);

export const markAllAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.put('http://localhost:5000/api/notifications/read-all', {}, {
        headers: getAuthHeader(),
      });
      if (response.data && response.data.success) {
        return true;
      } else {
        return rejectWithValue('Failed to mark all as read');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Network error');
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    unreadCount: 0,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.items = action.payload || [];
        state.unreadCount = state.items.filter(n => !n.isRead).length;
        state.loading = false;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        const notif = state.items.find(n => n._id === action.payload || n.id === action.payload);
        if (notif && !notif.isRead) {
          notif.isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.items.forEach(n => { n.isRead = true; });
        state.unreadCount = 0;
      });
  },
});

export default notificationSlice.reducer;
