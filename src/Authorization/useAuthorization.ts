import { useCallback, useMemo } from "react"
import { useAppStore } from "src/StateGlobal/zustand"
import { AppAbility } from "./abilities"
import { getDefaultPermissionsForRole } from "./permissionMap"
import { AppRole, APP_ROLE_LABELS, resolveRole } from "./roles"

const normalizeAbilities = (abilities: AppAbility | AppAbility[] | undefined): AppAbility[] => {
  if (!abilities) return []
  return Array.isArray(abilities) ? abilities : [abilities]
}

export const useAuthorization = () => {
  const rawRole = useAppStore((state) => state.role)

  const role = useMemo(() => resolveRole(rawRole), [rawRole])

  const effectiveAbilities = useMemo(() => getDefaultPermissionsForRole(role), [role])

  const abilitySet = useMemo(() => new Set(effectiveAbilities), [effectiveAbilities])

  const can = useCallback(
    (abilities?: AppAbility | AppAbility[]) => {
      const requested = normalizeAbilities(abilities)
      if (requested.length === 0) return true
      return requested.every((ability) => abilitySet.has(ability))
    },
    [abilitySet]
  )

  const canSome = useCallback(
    (abilities?: AppAbility | AppAbility[]) => {
      const requested = normalizeAbilities(abilities)
      if (requested.length === 0) return true
      return requested.some((ability) => abilitySet.has(ability))
    },
    [abilitySet]
  )

  const hasRole = useCallback(
    (roles?: AppRole | AppRole[]) => {
      if (!roles) return true
      if (!role) return false
      const roleList = Array.isArray(roles) ? roles : [roles]
      return roleList.every((item) => item === role)
    },
    [role]
  )

  const hasAnyRole = useCallback(
    (roles?: AppRole | AppRole[]) => {
      if (!roles) return true
      if (!role) return false
      const roleList = Array.isArray(roles) ? roles : [roles]
      return roleList.includes(role)
    },
    [role]
  )

  return {
    role,
    roleLabel: role ? APP_ROLE_LABELS[role] : null,
    permissions: effectiveAbilities,
    can,
    canSome,
    hasRole,
    hasAnyRole,
    abilitySet
  }
}
