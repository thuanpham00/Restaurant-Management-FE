/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation } from "@tanstack/react-query"
import { Button, Form, FormInstance, InputNumber, Switch } from "antd"
import { useEffect, useState } from "react"
import { toast } from "react-toastify"
import { diningTableAPI } from "src/Apis/Admin"
import { isError422 } from "src/Helpers/utils"
import { TableSession, TableSessionDetail, TableSessionOrder } from "src/Types/tableSession.type"
import { ErrorResponse } from "src/Types/utils.type"

export default function InfoTable({
  dataTable,
  form,
  dataTableSessionDetail,
  dataTableSessionOrder
}: {
  dataTable: TableSession
  form: FormInstance<any>
  dataTableSessionDetail: TableSessionDetail
  dataTableSessionOrder: TableSessionOrder
}) {
  const [checkUpdate, setCheckUpdate] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    form.setFieldValue("table_number", dataTable.table_number)
    form.setFieldValue("capacity", dataTable.capacity)
    form.setFieldValue("is_active", dataTable.is_active)
  }, [dataTable, form])

  const updateDiningTableMutation = useMutation({
    mutationFn: (body: { table_number: number; capacity: number; is_active: boolean }) => {
      return diningTableAPI.updateDiningTable(dataTable.dining_table_id, {
        table_number: body.table_number,
        capacity: body.capacity,
        is_active: body.is_active
      })
    },
    onSuccess: () => {
      toast.success("Cập nhật bàn thành công!", {
        autoClose: 1500
      })
      setCheckUpdate(false)
      setLoading(false)
    },
    onError: (error: any) => {
      if (isError422<ErrorResponse<Record<string, string[]>>>(error)) {
        const errors = error.response?.data?.errors
        form.setFields(
          Object.entries(errors as Record<string, string[]>).map(([field, messages]) => ({
            name: field,
            errors: messages
          }))
        )
      }
    }
  })

  const handleUpdateDiningTable = (values: { table_number: number; capacity: number; is_active: boolean }) => {
    setLoading(true)
    updateDiningTableMutation.mutate(values)
  }

  const handleCheckUpdate = () => {
    if (dataTableSessionDetail || dataTableSessionOrder) {
      toast.error("Đang có phiên bàn nên không thể tiến hành cập nhật!", {
        autoClose: 1500
      })
    } else {
      setCheckUpdate(true)
    }
  }

  return (
    <div className="p-4 bg-[#fff] border border-gray-200 rounded-xl shadow-md">
      <Form form={form} layout="vertical" onFinish={handleUpdateDiningTable} initialValues={{ is_active: true }}>
        <h2 className="text-lg font-medium -tracking-wide mb-2">Thông tin bàn</h2>
        <Form.Item label="Số bàn" name="table_number" rules={[{ required: true, message: "Vui lòng nhập số bàn!" }]}>
          <InputNumber style={{ width: "100%" }} disabled={!checkUpdate} />
        </Form.Item>

        <Form.Item label="Sức chứa" name="capacity" rules={[{ required: true, message: "Vui lòng nhập sức chứa!" }]}>
          <InputNumber style={{ width: "100%" }} disabled={!checkUpdate} />
        </Form.Item>

        <Form.Item label="Hoạt động" name="is_active" valuePropName="checked">
          <Switch defaultChecked disabled={!checkUpdate} />
        </Form.Item>

        <div>
          {checkUpdate ? (
            <div className="flex items-center gap-2 justify-end">
              <Button danger onClick={() => setCheckUpdate(false)}>
                Hủy
              </Button>
              <Button type="primary" disabled={loading} htmlType="submit">
                Lưu
              </Button>
            </div>
          ) : (
            <div className="flex justify-end">
              <Button onClick={handleCheckUpdate} type="primary">
                Cập nhật
              </Button>
            </div>
          )}
        </div>
      </Form>
    </div>
  )
}
