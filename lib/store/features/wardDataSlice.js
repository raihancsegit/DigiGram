import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Keyed by `${unionSlug}-${wardId}`
  // Example: 'dumuria-ward-1': { memberName: '...', memberPhone: '...', villages: [...], stats: { population: '...', voters: '...' } }
  dynamicWardData: {},
};

const wardDataSlice = createSlice({
  name: 'wardData',
  initialState,
  reducers: {
    updateWardInfo: (state, action) => {
      const { key, data } = action.payload;
      state.dynamicWardData[key] = {
        ...state.dynamicWardData[key],
        ...data,
      };
    },
    resetWardData: (state) => {
      state.dynamicWardData = {};
    },
  },
});

export const { updateWardInfo, resetWardData } = wardDataSlice.actions;
export default wardDataSlice.reducer;
