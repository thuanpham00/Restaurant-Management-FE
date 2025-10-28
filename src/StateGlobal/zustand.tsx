import { create } from "zustand"
import { employeesAPI } from "src/Apis/Admin"
import {
  getAccessTokenFromLS,
  getAvatarImageFromLS,
  getEmployeeIdFromLS,
  getNameUserFromLS,
  getUserIdFromLS,
  getRoleFromLS,
  setAvatarImageToLS,
  setEmployeeIdToLS,
  setNameUserToLS,
  setRoleToLS
} from "src/Helpers/auth"
import type { Employee } from "src/Types/employee.type"

const normalizeString = (value?: string | null) => {
  if (value === undefined || value === null) {
    return null
  }
  const normalized = value.trim()
  if (!normalized || normalized.toLowerCase() === "null") {
    return null
  }
  return normalized
}

const syncNameToStorage = (value: string | null) => {
  if (value) {
    setNameUserToLS(value)
  } else {
    localStorage.removeItem("name_user")
  }
}

const syncRoleToStorage = (value: string | null) => {
  if (value) {
    setRoleToLS(value)
  } else {
    localStorage.removeItem("role")
  }
}

const syncAvatarToStorage = (value: string | null) => {
  if (value) {
    setAvatarImageToLS(value)
  } else {
    localStorage.removeItem("avatar")
  }
}

const syncEmployeeIdToStorage = (value: string | null) => {
  if (value) {
    setEmployeeIdToLS(value)
  } else {
    localStorage.removeItem("employeeId")
  }
}

const syncUserIdToStorage = (value: string | null) => {
  if (value) {
    localStorage.setItem("userId", value)
  } else {
    localStorage.removeItem("userId")
  }
}

const mapEmployeeToProfile = (employee: Employee) => {
  const user = employee.user
  const profileName = normalizeString(user?.name ?? employee.full_name)
  const profileRole = normalizeString(user?.role?.name ?? null)
  const profileAvatar = normalizeString(user?.avatar ?? null)
  const profileEmployeeId = normalizeString(employee.id)
  const profileUserId = normalizeString(user?.id ?? null)

  return {
    name: profileName,
    role: profileRole,
    avatar: profileAvatar,
    employeeId: profileEmployeeId,
    userId: profileUserId
  }
}

type State = {
  isAuthenticated: boolean
  nameUser: string | null
  role: string | null
  avatar: string | null
  userId: string | null
  employeeId: string | null
  listTablePrepayment: {
    idTableSession: string
    idDiningTable: string
    orderId: string
  }[]
  isShowCategory: boolean
  isRefreshingProfile: boolean
}

type Actions = {
  setIsAuthenticated: (value: boolean) => void
  setNameUser: (value: string | null) => void
  setRole: (value: string | null) => void
  setAvatar: (value: string | null) => void
  setUserId: (value: string | null) => void
  setEmployeeId: (value: string | null) => void
  setIsShowCategory: (value: boolean) => void
  applyEmployeeProfile: (employee: Employee) => void
  refreshEmployeeProfile: (employeeId?: string | null) => Promise<Employee | null>
  setListTablePrepayment: (value: { idTableSession: string; idDiningTable: string; orderId: string }[]) => void
  reset: () => void
}

export const useAppStore = create<State & Actions>((set, get) => {
  const initialName = normalizeString(getNameUserFromLS())
  const initialRole = normalizeString(getRoleFromLS())
  const initialAvatar = normalizeString(getAvatarImageFromLS())
  const initialUserId = normalizeString(getUserIdFromLS())
  const initialEmployeeId = normalizeString(getEmployeeIdFromLS())

  return {
    isAuthenticated: Boolean(getAccessTokenFromLS()),
    nameUser: initialName,
    role: initialRole,
    avatar: initialAvatar,
    userId: initialUserId,
    employeeId: initialEmployeeId,
    isShowCategory: false,
    isRefreshingProfile: false,
  listTablePrepayment: [],

    setIsAuthenticated: (value) => set({ isAuthenticated: value }),
    setNameUser: (value) => {
      const nextValue = normalizeString(value)
      syncNameToStorage(nextValue)
      set({ nameUser: nextValue })
    },
    setRole: (value) => {
      const nextValue = normalizeString(value)
      syncRoleToStorage(nextValue)
      set({ role: nextValue })
    },
    setAvatar: (value) => {
      const nextValue = normalizeString(value)
      syncAvatarToStorage(nextValue)
      set({ avatar: nextValue })
    },
    setUserId: (value) => {
      const nextValue = normalizeString(value)
      syncUserIdToStorage(nextValue)
      set({ userId: nextValue })
    },
    setEmployeeId: (value) => {
      const nextValue = normalizeString(value)
      syncEmployeeIdToStorage(nextValue)
      set({ employeeId: nextValue })
    },
    setIsShowCategory: (value) => set({ isShowCategory: value }),
  setListTablePrepayment: (value) => set({ listTablePrepayment: value }),

    applyEmployeeProfile: (employee) => {
      const profile = mapEmployeeToProfile(employee)
      const current = get()

      syncNameToStorage(profile.name)
      syncRoleToStorage(profile.role)
      syncAvatarToStorage(profile.avatar)
      syncEmployeeIdToStorage(profile.employeeId)
      syncUserIdToStorage(profile.userId)

      if (
        current.nameUser === profile.name &&
        current.role === profile.role &&
        current.avatar === profile.avatar &&
        current.employeeId === profile.employeeId &&
        current.userId === profile.userId
      ) {
        return
      }

      set({
        nameUser: profile.name,
        role: profile.role,
        avatar: profile.avatar,
        employeeId: profile.employeeId,
        userId: profile.userId
      })
    },

    refreshEmployeeProfile: async (employeeId) => {
      const currentEmployeeId = normalizeString(employeeId ?? get().employeeId)
      if (!currentEmployeeId) {
        return null
      }

      set({ isRefreshingProfile: true })
      try {
        const response = await employeesAPI.getDetail(currentEmployeeId)
        const employee = response.data.data
        get().applyEmployeeProfile(employee)
        return employee
      } catch (error) {
        throw error
      } finally {
        set({ isRefreshingProfile: false })
      }
    },

    reset: () => {
      syncNameToStorage(null)
      syncRoleToStorage(null)
      syncAvatarToStorage(null)
      syncEmployeeIdToStorage(null)
      syncUserIdToStorage(null)

      set({
        isAuthenticated: false,
        nameUser: null,
        role: null,
        avatar: null,
        userId: null,
        employeeId: null,
        isShowCategory: false,
        isRefreshingProfile: false,
        listTablePrepayment: []
      })
    }
  }
})
