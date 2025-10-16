import { Checkbox, Spin, Typography, Card, Button, Collapse, Space, Badge, Tooltip } from "antd"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { rolesAPI, permissionsAPI } from "src/Apis/Admin"
import { toast } from "react-toastify"
import { useState, useMemo, Fragment } from "react"
import { Permission } from "src/Types/permissions.type"
import { Save, RotateCcw, List } from "lucide-react"
import { Helmet } from "react-helmet-async"
import { useNavigate } from "react-router-dom"
import NavigateBack from "src/Admin/Components/NavigateBack"
import "./ManagePermissionMatrix.css"

const { Title } = Typography
const { Panel } = Collapse

export default function ManagePermissionMatrix() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  
  const [pendingChanges, setPendingChanges] = useState<Record<string, string[]>>({})
  const [hasChanges, setHasChanges] = useState(false)

  // Fetch all roles
  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ["roles-matrix"],
    queryFn: () => rolesAPI.getList({ per_page: "99" }),
    staleTime: 5 * 60 * 1000
  })

  // Fetch all permissions
  const { data: permissionsData, isLoading: permissionsLoading } = useQuery({
    queryKey: ["permissions-matrix"],
    queryFn: () => permissionsAPI.getList({ per_page: "99" }),
    staleTime: 5 * 60 * 1000
  })

  const roles = rolesData?.data?.data?.data || []
  const permissions = permissionsData?.data?.data?.data || []

  useMemo(() => {
    if (roles.length > 0 && Object.keys(pendingChanges).length === 0) {
      const initialChanges: Record<string, string[]> = {}
      roles.forEach((role) => {
        initialChanges[role.id] = role.permissions?.map((p) => p.id) || []
      })
      setPendingChanges(initialChanges)
    }
  }, [roles])

  const batchSyncMutation = useMutation({
    mutationFn: async (changes: Record<string, string[]>) => {
      const promises = Object.entries(changes).map(([roleId, permissionIds]) =>
        rolesAPI.syncPermissions(roleId, permissionIds)
      )
      return Promise.all(promises)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles-matrix"] })
      queryClient.invalidateQueries({ queryKey: ["listRoles"] })
      toast.success("Cập nhật tất cả quyền thành công!")
      setHasChanges(false)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Cập nhật quyền thất bại!")
    }
  })

  // Handle checkbox change (store in pending changes)
  const handlePermissionToggle = (roleId: string, permissionId: string, checked: boolean) => {
    setPendingChanges((prev) => {
      const currentPermissions = prev[roleId] || []
      const newPermissions = checked
        ? [...currentPermissions, permissionId]
        : currentPermissions.filter((id) => id !== permissionId)

      return {
        ...prev,
        [roleId]: newPermissions
      }
    })
    setHasChanges(true)
  }

  // Save all changes
  const handleSaveChanges = () => {
    batchSyncMutation.mutate(pendingChanges)
  }

  // Reset to original state
  const handleReset = () => {
    const initialChanges: Record<string, string[]> = {}
    roles.forEach((role) => {
      initialChanges[role.id] = role.permissions?.map((p) => p.id) || []
    })
    setPendingChanges(initialChanges)
    setHasChanges(false)
  }

  // Check if role has permission (from pending changes)
  const hasPermission = (roleId: string, permissionId: string): boolean => {
    return pendingChanges[roleId]?.includes(permissionId) || false
  }

  const changedCount = useMemo(() => {
    let count = 0
    roles.forEach((role) => {
      const original = new Set(role.permissions?.map((p: Permission) => p.id) || [])
      const current = new Set(pendingChanges[role.id] || [])
      
      current.forEach((permId: string) => {
        if (!original.has(permId)) {
          count++
        }
      })
      
      // Đếm số permission bị xóa (có trong original nhưng không có trong current)
      original.forEach((permId: string) => {
        if (!current.has(permId)) {
          count++
        }
      })
    })
    return count
  }, [roles, pendingChanges])

  const groupedPermissions = permissions.reduce(
    (acc: Record<string, Permission[]>, permission: Permission) => {
      const module = permission.code.split(".")[0]
      if (!acc[module]) {
        acc[module] = []
      }
      acc[module].push(permission)
      return acc
    },
    {} as Record<string, Permission[]>
  )

  if (rolesLoading || permissionsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" tip="Đang tải dữ liệu..." />
      </div>
    )
  }

  return (
    <Fragment>
      <Helmet>
        <title>Ma trận Phân quyền | Restaurant Management</title>
        <meta name="description" content="Ma trận phân quyền cho vai trò trong hệ thống" />
      </Helmet>

      <div className="">
        <NavigateBack />

        <Card style={{border : 0}}>
          <div className="flex items-center justify-between mb-4">
            <Title level={4} className="mb-0">
              Ma trận Phân quyền
            </Title>
            
            <Space>
              <Button 
                icon={<List size={16} />} 
                onClick={() => navigate("/admin/roles")}
              >
                Danh sách Vai trò
              </Button>
              {hasChanges && (
                <Badge count={changedCount} offset={[-5, 5]}>
                  <Button
                    icon={<RotateCcw size={16} />}
                    onClick={handleReset}
                    disabled={batchSyncMutation.isPending}
                  >
                    Đặt lại
                  </Button>
                </Badge>
              )}
              <Button
                type="primary"
                icon={<Save size={16} />}
                onClick={handleSaveChanges}
                loading={batchSyncMutation.isPending}
                disabled={!hasChanges}
              >
                Lưu thay đổi {hasChanges && `(${changedCount})`}
              </Button>
            </Space>
          </div>

          <div className="overflow-x-auto max-h-[calc(100vh-280px)] border border-gray-300 rounded">
            <div className="min-w-full">
              <Collapse 
                defaultActiveKey={Object.keys(groupedPermissions).slice(0, 3)}
                className="permission-matrix-collapse"
              >
                {Object.entries(groupedPermissions).map(([module, perms]) => (
                  <Panel
                    header={
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-blue-700">
                          {module.toUpperCase()}
                        </span>
                        <Badge count={perms.length} showZero color="blue" />
                      </div>
                    }
                    key={module}
                  >
                    <div className="overflow-x-auto">
                      <table className="w-full ">
                        <thead className="sticky top-0 bg-gray-50 z-20">
                          <tr>
                            <th className="border border-gray-300 px-3 py-2 text-left font-semibold bg-gray-50 sticky left-0 z-30 min-w-[250px]">
                              Quyền
                            </th>
                            {roles.map((role) => (
                              <th
                                key={role.id}
                                className="px-3 py-2 text-center font-semibold bg-gray-50 min-w-[100px]"
                              >
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-xs">{role.name}</span>
                                  {!role.is_active && (
                                    <span className="text-[10px] text-red-500">(Inactive)</span>
                                  )}
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {perms.map((permission) => (
                            <tr key={permission.id} className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-3 py-2 sticky left-0 bg-white z-10">
                                <Tooltip 
                                  title={
                                    <div>
                                      <div className="font-semibold mb-1">{permission.name}</div>
                                      <div className="text-xs mb-1">Code: {permission.code}</div>
                                      {permission.description && (
                                        <div className="text-xs text-gray-300">{permission.description}</div>
                                      )}
                                    </div>
                                  }
                                  placement="topLeft"
                                >
                                  <div className="cursor-help">
                                    <span className="text-sm">{permission.name}</span>
                                  </div>
                                </Tooltip>
                              </td>
                              {roles.map((role) => {
                                const checked = hasPermission(role.id, permission.id)

                                return (
                                  <td key={`${role.id}-${permission.id}`} className="border border-gray-300 px-3 py-2 text-center bg-white">
                                    <Checkbox
                                      checked={checked}
                                      onChange={(e) => handlePermissionToggle(role.id, permission.id, e.target.checked)}
                                      disabled={!role.is_active || !permission.is_active}
                                    />
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Panel>
                ))}
              </Collapse>
            </div>
          </div>

          <div className="mt-3 text-xs text-gray-500 space-y-1">
            <p>💡 Click checkbox để chọn/bỏ chọn quyền, sau đó nhấn "Lưu thay đổi" để cập nhật</p>
            <p>⚠️ Các vai trò hoặc quyền không hoạt động sẽ không thể chỉnh sửa</p>
          </div>
        </Card>
      </div>
    </Fragment>
  )
}
