import { ReactNode } from "react"
import { AppAbility } from "./abilities"
import { AppRole } from "./roles"
import { useAuthorization } from "./useAuthorization"

export type PermissionGateProps = {
  ability?: AppAbility | AppAbility[]
  anyAbility?: AppAbility | AppAbility[]
  roles?: AppRole | AppRole[]
  hide?: boolean
  fallback?: ReactNode | ((context: { role: AppRole | null }) => ReactNode)
  children: ReactNode
}

export function PermissionGate({ ability, anyAbility, roles, hide = true, fallback, children }: PermissionGateProps) {
  const { role, can, canSome, hasAnyRole } = useAuthorization()

  const matchesAbility = ability ? can(ability) : true
  const matchesAnyAbility = anyAbility ? canSome(anyAbility) : true
  const matchesRole = roles ? hasAnyRole(roles) : true

  const isAllowed = matchesAbility && matchesAnyAbility && matchesRole

  if (isAllowed) {
    return <>{children}</>
  }

  if (typeof fallback === "function") {
    return <>{fallback({ role })}</>
  }

  if (fallback !== undefined) {
    return <>{fallback}</>
  }

  if (hide) {
    return null
  }

  return null
}

export default PermissionGate
