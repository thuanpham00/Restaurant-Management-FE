/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button, Form, Input, InputNumber, Modal, Switch } from "antd"
import { useEffect, useState } from "react"
import { Helmet } from "react-helmet-async"
import { useLocation } from "react-router-dom"
import { toast } from "react-toastify"
import NavigateBack from "src/Admin/Components/NavigateBack"
import { menusAPI } from "src/Apis"
import { isError400 } from "src/Helpers/utils"
import { Menus } from "src/Types/utils.type"

export default function MenuDetail() {
  const { state } = useLocation()
  const queryClient = useQueryClient()

  const detailMenu = state?.dataMenu as Menus

  const [checkUpdate, setCheckUpdate] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm<Menus>()

  useEffect(() => {
    form.setFieldsValue({
      name: detailMenu.name,
      description: detailMenu.description,
      version: detailMenu.version,
      is_active: detailMenu.is_active
    })
  }, [detailMenu, form])

  const updateMutation = useMutation({
    mutationFn: (values: Partial<Menus>) => {
      return menusAPI.update(detailMenu.id as string, values)
    }
  })

  const handleUpdate = () => {
    form.validateFields().then((values) => {
      setLoading(true)

      updateMutation.mutate(values, {
        onSuccess: (res) => {
          toast.success("Cập nhật thực đơn thành công!", { autoClose: 1500 })
          form.setFieldsValue(res.data) // nếu API trả về dữ liệu mới
          setCheckUpdate(false)
          queryClient.invalidateQueries({ queryKey: ["listMenu"] })
        },
        onError: (error) => {
          if (isError400<any>(error)) {
            toast.error(error.response?.data?.message, { autoClose: 1500 })
          }
        },
        onSettled: () => {
          setLoading(false)
        }
      })
    })
  }

  const deleteMutation = useMutation({
    mutationFn: (id: string) => menusAPI.delete(id),
    onSuccess: () => {
      toast.success("Xóa thực đơn thành công!", {
        autoClose: 1500
      })
      queryClient.invalidateQueries({ queryKey: ["listMenu"] })
    },
    onError: () => {
      toast.error("Thực đơn đang sử dụng nên không thể xóa!", {
        autoClose: 1500
      })
    }
  })

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: "Bạn có chắc muốn xóa?",
      content: "Thực đơn sẽ bị xóa vĩnh viễn.",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: () => deleteMutation.mutate(id)
    })
  }

  return (
    <div>
      <Helmet>
        <title>Chi tiết thực đơn</title>
        <meta name="description" content="Đây là trang Restaurant Management - Quản lý bàn" />
      </Helmet>
      <NavigateBack />
      <h1 className="text-2xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 my-2">
        Chi tiết thực đơn
      </h1>

      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-md">
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Tên Menu" rules={[{ required: true, message: "Vui lòng nhập tên menu" }]}>
            <Input placeholder="Nhập tên menu..." disabled={!checkUpdate} />
          </Form.Item>

          {/* Mô tả */}
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} placeholder="Nhập mô tả menu..." disabled={!checkUpdate} />
          </Form.Item>

          {/* Phiên bản */}
          <Form.Item
            name="version"
            label="Phiên bản"
            rules={[
              { required: true, message: "Vui lòng nhập phiên bản" },
              { type: "number", min: 1, message: "Phiên bản phải >= 1" }
            ]}
          >
            <InputNumber min={1} className="w-full" placeholder="Nhập số phiên bản..." disabled={!checkUpdate} />
          </Form.Item>

          {/* Trạng thái hoạt động */}
          <Form.Item
            name="is_active"
            label="Trạng thái"
            valuePropName="checked"
            tooltip="Chỉ một menu được kích hoạt tại một thời điểm"
          >
            <Switch checkedChildren="Đang áp dụng" unCheckedChildren="Không hoạt động" disabled={!checkUpdate} />
          </Form.Item>

          <div>
            {checkUpdate ? (
              <div className="flex items-center gap-2 justify-end">
                <Button danger onClick={() => setCheckUpdate(false)}>
                  Hủy
                </Button>
                <Button type="primary" disabled={loading} htmlType="submit" onClick={handleUpdate}>
                  Lưu
                </Button>
              </div>
            ) : (
              <div className="flex justify-end gap-2">
                <Button danger type="primary" onClick={() => handleDelete(detailMenu.id)}>
                  Xóa
                </Button>
                <Button onClick={() => setCheckUpdate(true)} type="primary">
                  Cập nhật
                </Button>
              </div>
            )}
          </div>
        </Form>
      </div>
    </div>
  )
}
