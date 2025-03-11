import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SettingsState {
  isSettingsOpen: boolean;
  fontSize: number;
  theme: 'light' | 'dark';
  ttsEnabled: boolean;
  ttsRate: number;
  ttsPitch: number;
  ttsVoice: string;
  ttsAutoScroll: boolean;
  ttsScrollPosition: 'start' | 'center';
  ttsScrollBehavior: 'smooth' | 'auto';
}

const initialState: SettingsState = {
  isSettingsOpen: false,
  fontSize: 18,
  theme: 'light',
  ttsEnabled: false,
  ttsRate: 1,
  ttsPitch: 1,
  ttsVoice: '',
  ttsAutoScroll: true,
  ttsScrollPosition: 'start',
  ttsScrollBehavior: 'smooth'
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
    },
    setTtsAutoScroll: (state, action: PayloadAction<boolean>) => {
      state.ttsAutoScroll = action.payload;
    },
    setTtsScrollPosition: (state, action: PayloadAction<'start' | 'center'>) => {
      state.ttsScrollPosition = action.payload;
    },
    setTtsScrollBehavior: (state, action: PayloadAction<'smooth' | 'auto'>) => {
      state.ttsScrollBehavior = action.payload;
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
  setTtsVoice,
  setTtsAutoScroll,
  setTtsScrollPosition,
  setTtsScrollBehavior
} = settingsSlice.actions;
export default settingsSlice.reducer; 