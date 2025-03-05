import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SettingsState {
  isSettingsOpen: boolean;
  fontSize: number;
  theme: 'light' | 'dark';
}

const initialState: SettingsState = {
  isSettingsOpen: false,
  fontSize: 18,
  theme: 'light'
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    toggleSettings: (state) => {
      state.isSettingsOpen = !state.isSettingsOpen;
    },
    setFontSize: (state, action: PayloadAction<number>) => {
      state.fontSize = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    }
  }
});

export const { toggleSettings, setFontSize, setTheme } = settingsSlice.actions;
export default settingsSlice.reducer; 