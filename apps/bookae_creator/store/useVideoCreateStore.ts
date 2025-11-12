import { create } from 'zustand'

export type Platform = 'coupang' | 'naver' | 'aliexpress' | 'amazon'

export interface Product {
  id: string
  name: string
  price: number
  image: string
  platform: Platform
  url: string
  description?: string
}

export interface VideoEditData {
  title: string
  effects: string[]
  productContent: Record<string, string> // 상품별 편집 내용
}

interface VideoCreateState {
  currentStep: number
  selectedProducts: Product[]
  videoEditData: VideoEditData | null
  isCreating: boolean
  creationProgress: number
  setCurrentStep: (step: number) => void
  addProduct: (product: Product) => void
  removeProduct: (productId: string) => void
  clearProducts: () => void
  setVideoEditData: (data: VideoEditData) => void
  setIsCreating: (isCreating: boolean) => void
  setCreationProgress: (progress: number) => void
  reset: () => void
}

const initialState = {
  currentStep: 1,
  selectedProducts: [],
  videoEditData: null,
  isCreating: false,
  creationProgress: 0,
}

export const useVideoCreateStore = create<VideoCreateState>((set) => ({
  ...initialState,
  setCurrentStep: (step) => set({ currentStep: step }),
  addProduct: (product) =>
    set((state) => {
      const exists = state.selectedProducts.some((p) => p.id === product.id)
      if (exists) return state
      return {
        selectedProducts: [...state.selectedProducts, product],
      }
    }),
  removeProduct: (productId) =>
    set((state) => ({
      selectedProducts: state.selectedProducts.filter((p) => p.id !== productId),
    })),
  clearProducts: () => set({ selectedProducts: [] }),
  setVideoEditData: (data) => set({ videoEditData: data }),
  setIsCreating: (isCreating) => set({ isCreating }),
  setCreationProgress: (progress) => set({ creationProgress: progress }),
  reset: () => set(initialState),
}))

