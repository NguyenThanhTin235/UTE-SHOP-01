import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Fetch global platform settings and theme
export const fetchPlatformConfig = createAsyncThunk(
  'ui/fetchPlatformConfig',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('http://localhost:5000/api/public/ui-config');
      if (response.data && response.data.success) {
        return response.data.data; // { theme, platformSettings }
      } else {
        return rejectWithValue('Failed to load UI config');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Network error');
    }
  }
);

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    theme: null,
    platformSettings: null,
    isLoaded: false,
    error: null,
    isSidebarOpen: true,
  },
  reducers: {
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    setSidebarState: (state, action) => {
      state.isSidebarOpen = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlatformConfig.pending, (state) => {
        state.isLoaded = false;
        state.error = null;
      })
      .addCase(fetchPlatformConfig.fulfilled, (state, action) => {
        state.theme = action.payload.theme;
        state.platformSettings = action.payload.platformSettings;
        state.isLoaded = true;
        
        // Apply CSS variables globally
        const theme = action.payload.theme;
        if (theme) {
          const root = document.documentElement;
          if (theme.primaryColor) root.style.setProperty('--color-primary', theme.primaryColor);
          if (theme.fontFamily) {
            const fontBase = theme.fontFamily.split(' (')[0];
            root.style.setProperty('--font-family', `"${fontBase}", sans-serif`);
          }
          if (theme.borderRadius) {
             if (theme.borderRadius === 'sharp') root.style.setProperty('--radius-base', '0px');
             else if (theme.borderRadius === 'pill') root.style.setProperty('--radius-base', '9999px');
             else root.style.setProperty('--radius-base', '0.5rem');
          }
        }
      })
      .addCase(fetchPlatformConfig.rejected, (state, action) => {
        state.isLoaded = true;
        state.error = action.payload;
      });
  },
});

export const { toggleSidebar, setSidebarState } = uiSlice.actions;

export default uiSlice.reducer;
