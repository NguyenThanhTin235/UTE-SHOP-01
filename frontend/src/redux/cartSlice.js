import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import toast from 'react-hot-toast';

const getAuthHeader = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
  return { Authorization: `Bearer ${token}` };
};

export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('http://localhost:5000/api/cart', {
        headers: getAuthHeader(),
      });
      if (response.data && response.data.success) {
        return response.data.data || [];
      } else {
        return rejectWithValue('Failed to load cart items');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Network error');
    }
  }
);

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ productId, variantId, quantity, note }, { rejectWithValue }) => {
    try {
      const response = await axios.post('http://localhost:5000/api/cart/add', 
        { productId, variantId, quantity, note }, 
        { headers: getAuthHeader() }
      );
      if (response.data && response.data.success) {
        window.dispatchEvent(new Event('cartUpdate'));
        return response.data.data;
      } else {
        return rejectWithValue('Failed to add item to cart');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add item to cart');
    }
  }
);

export const updateCartItem = createAsyncThunk(
  'cart/updateCartItem',
  async ({ itemId, quantity, note }, { rejectWithValue, dispatch }) => {
    try {
      const data = { itemId };
      if (quantity !== undefined) data.quantity = quantity;
      if (note !== undefined) data.note = note;

      const response = await axios.put('http://localhost:5000/api/cart/update', data, {
        headers: getAuthHeader(),
      });
      if (response.data && response.data.success) {
        // Instead of returning the updated item and updating state manually,
        // we can just re-fetch the whole cart or update the single item locally.
        // Let's just return what we changed to update locally.
        window.dispatchEvent(new Event('cartUpdate'));
        return { itemId, quantity, note };
      } else {
        return rejectWithValue('Failed to update item');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update item');
    }
  }
);

export const removeCartItem = createAsyncThunk(
  'cart/removeCartItem',
  async (itemId, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`http://localhost:5000/api/cart/remove/${itemId}`, {
        headers: getAuthHeader(),
      });
      if (response.data && response.data.success) {
        window.dispatchEvent(new Event('cartUpdate'));
        return itemId;
      } else {
        return rejectWithValue('Failed to remove item');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove item');
    }
  }
);

export const removeSelectedCartItems = createAsyncThunk(
  'cart/removeSelectedCartItems',
  async (itemIds, { rejectWithValue }) => {
    try {
      await Promise.all(
        itemIds.map(itemId => 
          axios.delete(`http://localhost:5000/api/cart/remove/${itemId}`, {
            headers: getAuthHeader(),
          })
        )
      );
      window.dispatchEvent(new Event('cartUpdate'));
      return itemIds;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove items');
    }
  }
);

export const clearCart = createAsyncThunk(
  'cart/clearCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.delete('http://localhost:5000/api/cart/clear', {
        headers: getAuthHeader(),
      });
      if (response.data && response.data.success) {
        window.dispatchEvent(new Event('cartUpdate'));
        return true;
      } else {
        return rejectWithValue('Failed to clear cart');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to clear cart');
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearCartState: (state) => {
      state.items = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchCart
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.items = [];
      })
      
      // updateCartItem
      .addCase(updateCartItem.fulfilled, (state, action) => {
        const { itemId, quantity, note } = action.payload;
        const existingItem = state.items.find(item => item.id === itemId);
        if (existingItem) {
          if (quantity !== undefined) existingItem.quantity = quantity;
          if (note !== undefined) existingItem.note = note;
        }
      })
      
      // removeCartItem
      .addCase(removeCartItem.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.id !== action.payload);
      })
      
      // removeSelectedCartItems
      .addCase(removeSelectedCartItems.fulfilled, (state, action) => {
        const idsToRemove = action.payload;
        state.items = state.items.filter(item => !idsToRemove.includes(item.id));
      })
      
      // clearCart
      .addCase(clearCart.fulfilled, (state) => {
        state.items = [];
      });
  },
});

export const { clearCartState } = cartSlice.actions;
export default cartSlice.reducer;
