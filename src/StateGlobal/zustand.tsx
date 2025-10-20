import { create } from "zustand"
import {
  getAccessTokenFromLS,
  getAvatarImageFromLS,
  getEmployeeIdFromLS,
  getNameUserFromLS,
  getUserIdFromLS,
  getRoleFromLS
} from "src/Helpers/auth"

type State = {
  isAuthenticated: boolean
  nameUser: string | null
  role: string | null
  avatar: string | null
  userId: string | null
  employeeId: string | null
  isShowCategory: boolean
}

type Actions = {
  setIsAuthenticated: (value: boolean) => void
  setNameUser: (value: string | null) => void
  setRole: (value: string | null) => void
  setAvatar: (value: string | null) => void
  setUserId: (value: string | null) => void
  setEmployeeId: (value: string | null) => void
  setIsShowCategory: (value: boolean) => void
  reset: () => void
}

export const useAppStore = create<State & Actions>((set) => ({
  isAuthenticated: Boolean(getAccessTokenFromLS()),
  nameUser: getNameUserFromLS(),
  role: getRoleFromLS(),
  avatar: getAvatarImageFromLS(),
  userId: getUserIdFromLS(),
  employeeId: getEmployeeIdFromLS(),
  isShowCategory: false,

  setIsAuthenticated: (value) => set({ isAuthenticated: value }),
  setNameUser: (value) => set({ nameUser: value }),
  setRole: (value) => set({ role: value }),
  setAvatar: (value) => set({ avatar: value }),
  setUserId: (value) => set({ userId: value }),
  setEmployeeId: (value) => set({ employeeId: value }),
  setIsShowCategory: (value) => set({ isShowCategory: value }),

  reset: () =>
    set({
      isAuthenticated: false,
      nameUser: null,
      role: null,
      avatar: null,
      userId: null,
      employeeId: null,
      isShowCategory: false
    })
}))
