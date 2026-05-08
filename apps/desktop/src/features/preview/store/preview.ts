import { create } from "zustand";

type PreviewState = {
  isLivePreview: boolean;
  isPreviewPaneOpen: boolean;
  toggleLivePreview: () => void;
  togglePreviewPane: () => void;
};

export const usePreviewStore = create<PreviewState>()((set) => ({
  isLivePreview: false,
  isPreviewPaneOpen: false,
  toggleLivePreview: () => set((state) => ({ isLivePreview: !state.isLivePreview })),
  togglePreviewPane: () => set((state) => ({ isPreviewPaneOpen: !state.isPreviewPaneOpen })),
}));
