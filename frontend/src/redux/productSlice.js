import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (params, { rejectWithValue }) => {
    try {
      const response = await axios.get('http://localhost:5000/api/public/products', { params });
      if (response.data && response.data.success) {
        return response.data; // { data: [...], meta: { pagination } }
      } else {
        return rejectWithValue('Failed to load products');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Network error');
    }
  }
);

export const fetchProductDetail = createAsyncThunk(
  'products/fetchProductDetail',
  async (slug, { rejectWithValue }) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/public/products/${slug}`);
      if (response.data && response.data.success) {
        return response.data.data;
      } else {
        return rejectWithValue('Failed to load product detail');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Network error');
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'products/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('http://localhost:5000/api/public/categories');
      if (response.data && response.data.success) {
        return response.data.data;
      } else {
        return rejectWithValue('Failed to load categories');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Network error');
    }
  }
);

const productSlice = createSlice({
  name: 'products',
  initialState: {
    list: [],
    meta: null,
    currentProduct: null,
    categories: [],
    loading: false,
    detailLoading: false,
    categoriesLoading: false,
    error: null,
    detailError: null,
  },
  reducers: {
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
      state.detailError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchProducts
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.list = action.payload.data;
        state.meta = action.payload.meta;
        state.loading = false;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // fetchProductDetail
      .addCase(fetchProductDetail.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
      })
      .addCase(fetchProductDetail.fulfilled, (state, action) => {
        state.currentProduct = action.payload;
        state.detailLoading = false;
      })
      .addCase(fetchProductDetail.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload;
      })
      // fetchCategories
      .addCase(fetchCategories.pending, (state) => {
        state.categoriesLoading = true;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
        state.categoriesLoading = false;
      })
      .addCase(fetchCategories.rejected, (state) => {
        state.categoriesLoading = false;
      });
  },
});

export const { clearCurrentProduct } = productSlice.actions;
export default productSlice.reducer;
