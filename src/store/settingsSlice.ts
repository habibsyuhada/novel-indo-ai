import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SettingsState {
  isSettingsOpen: boolean;
  fontSize: number;
  theme: 'light' | 'dark';
  ttsEnabled: boolean;
  ttsRate: number;
  ttsPitch: number;
  ttsVoice: string;
}

const initialState: SettingsState = {
  isSettingsOpen: false,
  fontSize: 18,
  theme: 'light',
  ttsEnabled: false,
  ttsRate: 1,
  ttsPitch: 1,
  ttsVoice: ''
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
    },
    setTtsEnabled: (state, action: PayloadAction<boolean>) => {
      state.ttsEnabled = action.payload;
    },
    setTtsRate: (state, action: PayloadAction<number>) => {
      state.ttsRate = action.payload;
    },
    setTtsPitch: (state, action: PayloadAction<number>) => {
      state.ttsPitch = action.payload;
    },
    setTtsVoice: (state, action: PayloadAction<string>) => {
      state.ttsVoice = action.payload;
    }
  }
});

export const { 
  toggleSettings, 
  setFontSize, 
  setTheme, 
  setTtsEnabled,
  setTtsRate,
  setTtsPitch,
  setTtsVoice
} = settingsSlice.actions;
export default settingsSlice.reducer; 