import { useCallback, useMemo } from "react"
import { useAppStore } from "src/StateGlobal/zustand"
import { AppAbility, ALL_ABILITIES } from "./abilities"
import { getDefaultPermissionsForRole } from "./permissionMap"
import { AppRole, APP_ROLE_LABELS, resolveRole } from "./roles"

const ABILITY_LOOKUP = new Map<string, AppAbility>(
  ALL_ABILITIES.map((ability) => [ability.toLowerCase(), ability])
)

const normalizeAbilities = (abilities: AppAbility | AppAbility[] | undefined): AppAbility[] => {
  if (!abilities) return []
  return Array.isArray(abilities) ? abilities : [abilities]
}

const mapPermissionCodeToAbility = (code?: string | null): AppAbility | undefined => {
  if (!code) return undefined
  const normalized = code.trim().toLowerCase()
  return ABILITY_LOOKUP.get(normalized)
}

export const useAuthorization = () => {
  const rawRole = useAppStore((state) => state.role)
  const explicitPermissions = useAppStore((state) => state.permissions)

  const role = useMemo(() => resolveRole(rawRole), [rawRole])

  const normalizedExplicitAbilities = useMemo(() => {
    if (!explicitPermissions || explicitPermissions.length === 0) {
      return []
    }
    const mapped = explicitPermissions
      .map((permission: string) => mapPermissionCodeToAbility(permission))
      .filter((ability): ability is AppAbility => Boolean(ability))
    return Array.from(new Set(mapped))
  }, [explicitPermissions])

  const effectiveAbilities = useMemo(() => {
    if (normalizedExplicitAbilities.length > 0) {
      return normalizedExplicitAbilities
    }
    return getDefaultPermissionsForRole(role)
  }, [normalizedExplicitAbilities, role])

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
