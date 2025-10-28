import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Badge, Button, Card, Col, Descriptions, Result, Row, Spin, Tag } from "antd"
import { Helmet } from "react-helmet-async"
import dayjs from "dayjs"
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "react-toastify"

import NavigateBack from "src/Admin/Components/NavigateBack"
import { employeesAPI } from "src/Apis/Admin"
import InputFileImage from "src/Components/InputFileImage"
import { assets } from "src/Assets/assets"
import { Employee } from "src/Types/employee.type"
import { useAppStore } from "src/StateGlobal/zustand"
import { path } from "src/Constants/path"

const CONTRACT_TYPES: Record<number, { label: string; color: string }> = {
  0: { label: "Full-time", color: "green" },
  1: { label: "Part-time", color: "blue" }
}

const GENDER_LABELS: Record<string, string> = {
  male: "Nam",
  female: "Nữ",
  other: "Khác"
}

export default function EmployeeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const employeeIdFromStore = useAppStore((state) => state.employeeId)
  const applyEmployeeProfile = useAppStore((state) => state.applyEmployeeProfile)
  const refreshEmployeeProfile = useAppStore((state) => state.refreshEmployeeProfile)
  const effectiveEmployeeId = id ?? employeeIdFromStore ?? null
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const { data, isFetching, isError, error } = useQuery({
    queryKey: ["employeeDetailPage", effectiveEmployeeId],
    queryFn: ({ signal }) => employeesAPI.getDetail(effectiveEmployeeId as string, signal),
    enabled: Boolean(effectiveEmployeeId),
    staleTime: 3 * 60 * 1000,
    placeholderData: keepPreviousData
  })

  const employee = useMemo(() => data?.data?.data as Employee | undefined, [data])
  const isSelfProfile = useMemo(
    () => Boolean(effectiveEmployeeId && employeeIdFromStore && effectiveEmployeeId === employeeIdFromStore),
    [effectiveEmployeeId, employeeIdFromStore]
  )

  useEffect(() => {
    if (employee && isSelfProfile) {
      applyEmployeeProfile(employee)
    }
  }, [employee, isSelfProfile])

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null)
      return
    }

    const fileUrl = URL.createObjectURL(selectedFile)
    setPreviewUrl(fileUrl)

    return () => {
      URL.revokeObjectURL(fileUrl)
    }
  }, [selectedFile])

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!effectiveEmployeeId) {
        throw new Error("Thiếu mã nhân viên để cập nhật ảnh")
      }
      return employeesAPI.update(effectiveEmployeeId, { avatar: file })
    },
    onSuccess: () => {
      toast.success("Cập nhật ảnh đại diện thành công", { autoClose: 1500 })
      setSelectedFile(null)
      queryClient.invalidateQueries({ queryKey: ["employeeDetailPage", effectiveEmployeeId] })
      queryClient.invalidateQueries({ queryKey: ["listEmployees"] })
      if (isSelfProfile && effectiveEmployeeId) {
        setTimeout(() => {
          refreshEmployeeProfile(effectiveEmployeeId).catch(() => undefined)
        }, 100)
      }
    },
    onError: (mutationError: unknown) => {
      const message = (mutationError as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(message || "Không thể cập nhật ảnh đại diện", { autoClose: 1500 })
    }
  })

  const handleFileSelect = (file?: File) => {
    setSelectedFile(file ?? null)
  }

  const handleUpload = () => {
    if (!selectedFile || uploadAvatarMutation.isPending) return
    uploadAvatarMutation.mutate(selectedFile)
  }

  const avatarSource = previewUrl || employee?.user.avatar || assets.rectangles.chef3
  const contractInfo = employee ? CONTRACT_TYPES[employee.contract_type] : undefined
  const genderLabel = employee?.gender ? GENDER_LABELS[employee.gender] ?? "Chưa xác định" : "Chưa xác định"
  const baseSalaryDisplay = useMemo(() => {
    if (!employee) return "-"
    const salaryNumber = Number(employee.base_salary)
    return Number.isNaN(salaryNumber) ? employee.base_salary : `${salaryNumber.toLocaleString("vi-VN")} đ`
  }, [employee])

  const fallbackPath = id ? path.AdminStaff : path.AdminDashboard

  if (!effectiveEmployeeId) {
    return (
      <Result
        status="404"
        title="Không tìm thấy nhân viên"
        subTitle="Không thể xác định tài khoản nhân viên cần hiển thị."
        extra={
          <Button type="primary" onClick={() => navigate(fallbackPath)}>
            Quay lại
          </Button>
        }
      />
    )
  }

  if (isError) {
    return (
      <Result
        status="500"
        title="Không thể tải dữ liệu"
        subTitle={
          (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Vui lòng thử lại sau."
        }
        extra={
          <Button
            type="primary"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["employeeDetailPage", effectiveEmployeeId] })}
          >
            Thử lại
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      <Helmet>
        <title>Chi tiết nhân viên</title>
      </Helmet>

      <NavigateBack />

      <Spin spinning={isFetching && !employee}>
        {!employee ? (
          <Result
            status="404"
            title="Không tìm thấy nhân viên"
            subTitle="Nhân viên có thể đã bị xóa hoặc không tồn tại."
            extra={
              <Button type="primary" onClick={() => navigate(fallbackPath)}>
                Quay lại
              </Button>
            }
          />
        ) : (
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Card title="Ảnh đại diện" className="shadow-sm">
                <Spin spinning={uploadAvatarMutation.isPending}>
                  <div className="flex flex-col items-center gap-4">
                    <img
                      src={avatarSource}
                      alt={`${employee.full_name} avatar`}
                      className="w-36 h-36 rounded-full object-cover border border-gray-200"
                    />
                    <InputFileImage onChange={handleFileSelect} />
                    {selectedFile ? (
                      <div className="flex gap-2">
                        <Button type="primary" onClick={handleUpload} loading={uploadAvatarMutation.isPending}>
                          Cập nhật ảnh
                        </Button>
                        <Button onClick={() => setSelectedFile(null)} disabled={uploadAvatarMutation.isPending}>
                          Bỏ chọn
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center">Chọn ảnh mới để thay đổi ảnh đại diện.</p>
                    )}
                  </div>
                </Spin>
              </Card>
            </Col>

            <Col xs={24} md={16}>
              <Card title="Thông tin nhân viên" className="shadow-sm">
                <Descriptions bordered column={1} size="middle">
                  <Descriptions.Item label="Tên nhân viên">{employee.full_name}</Descriptions.Item>
                  <Descriptions.Item label="Email">{employee.user.email}</Descriptions.Item>
                  <Descriptions.Item label="Số điện thoại">
                    {employee.phone || <span className="text-gray-400">Chưa cập nhật</span>}
                  </Descriptions.Item>
                  <Descriptions.Item label="Giới tính">{genderLabel}</Descriptions.Item>
                  <Descriptions.Item label="Địa chỉ">
                    {employee.address || <span className="text-gray-400">Chưa cập nhật</span>}
                  </Descriptions.Item>
                  <Descriptions.Item label="Số tài khoản">
                    {employee.bank_account || <span className="text-gray-400">Chưa cập nhật</span>}
                  </Descriptions.Item>
                  <Descriptions.Item label="Loại hợp đồng">
                    {contractInfo ? <Tag color={contractInfo.color}>{contractInfo.label}</Tag> : "Chưa xác định"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Lương cơ bản">{baseSalaryDisplay}</Descriptions.Item>
                  <Descriptions.Item label="Ngày tuyển dụng">
                    {employee.hire_date ? dayjs(employee.hire_date).format("DD/MM/YYYY") : <span className="text-gray-400">Chưa cập nhật</span>}
                  </Descriptions.Item>
                  <Descriptions.Item label="Trạng thái">
                    <Badge status={employee.is_active ? "success" : "error"} text={employee.is_active ? "Hoạt động" : "Ngừng hoạt động"} />
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngày tạo">
                    {dayjs(employee.created_at).format("DD/MM/YYYY HH:mm")}
                  </Descriptions.Item>
                  <Descriptions.Item label="Cập nhật lần cuối">
                    {dayjs(employee.updated_at).format("DD/MM/YYYY HH:mm")}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              <Card title="Thông tin tài khoản" className="shadow-sm mt-4">
                <Descriptions bordered column={1} size="middle">
                  <Descriptions.Item label="Mã người dùng">{employee.user.id}</Descriptions.Item>
                  <Descriptions.Item label="Trạng thái tài khoản">
                    <Badge
                      status={employee.user.status === 1 ? "success" : "error"}
                      text={employee.user.status_label || "Không xác định"}
                    />
                  </Descriptions.Item>
                  <Descriptions.Item label="Vai trò">
                    {employee.user.role?.name ? (
                      <Tag color="purple">{employee.user.role.name}</Tag>
                    ) : (
                      <span className="text-gray-400">Chưa gán</span>
                    )}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
          </Row>
        )}
      </Spin>
    </div>
  )
}
