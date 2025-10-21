import { ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { AppAbility } from "./abilities"
import { AppRole } from "./roles"
import { useAuthorization } from "./useAuthorization"
import { path } from "src/Constants/path"

export type PermissionBoundaryProps = {
  ability: AppAbility | AppAbility[]
  anyAbility?: AppAbility | AppAbility[]
  roles?: AppRole | AppRole[]
  fallback?: ReactNode
  redirectTo?: string
  children: ReactNode
}

export function PermissionBoundary({
  ability,
  anyAbility,
  roles,
  fallback,
  redirectTo = path.AdminDashboard,
  children
}: PermissionBoundaryProps) {
  const { can, canSome, hasAnyRole } = useAuthorization()

  const passesAll = can(ability)
  const passesAny = anyAbility ? canSome(anyAbility) : true
  const passesRole = roles ? hasAnyRole(roles) : true
  const isAllowed = passesAll && passesAny && passesRole

  if (isAllowed) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  return <Navigate to={redirectTo} replace />
}

export default PermissionBoundary
