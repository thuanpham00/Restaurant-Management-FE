import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button, Form, Input, Modal, Table, DatePicker, TimePicker, Spin } from "antd"
import { isUndefined, omitBy } from "lodash"
import { Clock, Edit, Filter, Plus, RotateCcw, Trash2 } from "lucide-react"
import { Fragment, useState } from "react"
import { toast } from "react-toastify"
import dayjs from "dayjs"
import { shiftsAPI } from "src/Apis/Admin"
import { Shift, ShiftFormInput, queryParamConfigShift } from "src/Types/shift.type"
import { PaginatedResponse } from "src/Types/utils.type"
import useQueryParams from "src/Hook/useQueryParams"

export default function ShiftListTab() {
  const queryConfig: queryParamConfigShift = useQueryParams()
  const queryClient = useQueryClient()

  // ========== STATE ==========
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null)
  const [form] = Form.useForm()
  const [filterForm] = Form.useForm()

  // ========== QUERY ==========
  const { data, isFetching } = useQuery({
    queryKey: ["shifts", queryConfig],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)

      const params = omitBy(
        {
          page: queryConfig.page || "1",
          per_page: queryConfig.per_page || "15",
          name: queryConfig.name,
          shift_date: queryConfig.shift_date,
          shift_date_from: queryConfig.shift_date_from,
          shift_date_to: queryConfig.shift_date_to
        },
        isUndefined
      )

      return shiftsAPI.getList(params, controller.signal)
    },
    staleTime: 3 * 60 * 1000,
    placeholderData: keepPreviousData
  })

  const paginated = data?.data?.data as PaginatedResponse<Shift>
  const listShifts = paginated?.data || []

  // ========== MUTATIONS ==========
  const createMutation = useMutation({
    mutationFn: (values: ShiftFormInput) => shiftsAPI.create(values),
    onSuccess: () => {
      toast.success("Tạo ca làm việc thành công!", { autoClose: 1500 })
      queryClient.invalidateQueries({ queryKey: ["shifts"] })
      handleCloseModal()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Tạo ca thất bại", { autoClose: 1500 })
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ShiftFormInput }) => 
      shiftsAPI.update(id, data),
    onSuccess: () => {
      toast.success("Cập nhật ca thành công!", { autoClose: 1500 })
      queryClient.invalidateQueries({ queryKey: ["shifts"] })
      handleCloseModal()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Cập nhật thất bại", { autoClose: 1500 })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => shiftsAPI.delete(id),
    onSuccess: () => {
      toast.success("Xóa ca thành công!", { autoClose: 1500 })
      queryClient.invalidateQueries({ queryKey: ["shifts"] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Xóa thất bại", { autoClose: 1500 })
    }
  })

  // ========== HANDLERS ==========
  const handleCreate = () => {
    setIsEditMode(false)
    setSelectedShift(null)
    form.resetFields()
    setIsModalOpen(true)
  }

  const handleEdit = (shift: Shift) => {
    setIsEditMode(true)
    setSelectedShift(shift)
    
    // Data format "HH:mm:ss" (string) → Dayjs object
    const parseTime = (timeStr: string | null) => {
      if (!timeStr) return null
      const [hours, minutes] = timeStr.split(':')
      return dayjs().hour(parseInt(hours)).minute(parseInt(minutes)).second(0)
    }
    
    form.setFieldsValue({
      name: shift.name,
      shift_date: shift.shift_date ? dayjs(shift.shift_date) : null,
      start_time: parseTime(shift.start_time),
      end_time: parseTime(shift.end_time)
    })
    setIsModalOpen(true)
  }

  const handleDelete = (shift: Shift) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: `Bạn có chắc muốn xóa ca "${shift.name}"?`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: () => deleteMutation.mutate(shift.id)
    })
  }

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const submitData: ShiftFormInput = {
        name: values.name,
        shift_date: values.shift_date ? dayjs(values.shift_date).format("YYYY-MM-DD") : undefined,
        start_time: dayjs(values.start_time).format("HH:mm"),
        end_time: dayjs(values.end_time).format("HH:mm")
      }

      if (isEditMode && selectedShift) {
        updateMutation.mutate({ id: selectedShift.id, data: submitData })
      } else {
        createMutation.mutate(submitData)
      }
    })
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setIsEditMode(false)
    setSelectedShift(null)
    form.resetFields()
  }

  // ========== FILTER HANDLERS ==========
  const handleFilter = () => {
    const values = filterForm.getFieldsValue()
    const params = new URLSearchParams(window.location.search)
    
    if (values.name) {
      params.set('name', values.name)
    } else {
      params.delete('name')
    }
    
    if (values.shift_date_from) {
      params.set('shift_date_from', dayjs(values.shift_date_from).format('YYYY-MM-DD'))
    } else {
      params.delete('shift_date_from')
    }
    
    if (values.shift_date_to) {
      params.set('shift_date_to', dayjs(values.shift_date_to).format('YYYY-MM-DD'))
    } else {
      params.delete('shift_date_to')
    }
    
    // Navigate to update URL
    window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  const handleResetFilter = () => {
    filterForm.resetFields()
    window.history.pushState({}, '', window.location.pathname)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  // ========== TABLE COLUMNS ==========
  const columns = [
    {
      title: "Tên ca",
      dataIndex: "name",
      key: "name",
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-blue-500" />
          <span className="font-medium">{text}</span>
        </div>
      )
    },
    {
      title: "Ngày",
      dataIndex: "shift_date",
      key: "shift_date",
      render: (date: string | null) => 
        date ? dayjs(date).format("DD/MM/YYYY") : <i className="text-gray-400">Không chỉ định</i>
    },
    {
      title: "Giờ bắt đầu",
      dataIndex: "start_time",
      key: "start_time",
      render: (time: string | null) => {
        if (!time) return <i className="text-gray-400">N/A</i>
        const formattedTime = time.slice(0, 5)
        return <span className="font-mono">{formattedTime}</span>
      }
    },
    {
      title: "Giờ kết thúc",
      dataIndex: "end_time",
      key: "end_time",
      render: (time: string | null) => {
        if (!time) return <i className="text-gray-400">N/A</i>
        // Backend trả về format "HH:mm:ss", chỉ cần lấy 5 ký tự đầu
        const formattedTime = time.slice(0, 5)
        return <span className="font-mono">{formattedTime}</span>
      }
    },
    {
      title: "Hành động",
      key: "action",
      width: 150,
      render: (_: any, record: Shift) => (
        <div className="flex gap-2">
          <Button
            size="small"
            type="primary"
            icon={<Edit size={16} />}
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Button
            size="small"
            danger
            icon={<Trash2 size={16} />}
            onClick={() => handleDelete(record)}
          />
        </div>
      )
    }
  ]

  // ========== RENDER ==========
  return (
    <div>
      {/* Header & Actions */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold">Danh sách Ca làm việc</h3>
          <p className="text-gray-500 text-sm">Quản lý các ca làm việc (templates)</p>
        </div>
        <Button
          type="primary"
          icon={<Plus size={18} />}
          onClick={handleCreate}
          size="large"
        >
          Thêm ca mới
        </Button>
      </div>

      {/* Filter Form */}
      <div className="mb-4 bg-gray-50 p-4 rounded-lg">
        <Form form={filterForm} layout="inline" className="flex flex-wrap gap-3">
          <Form.Item name="name" className="mb-0">
            <Input placeholder="Tên ca..." className="w-48" />
          </Form.Item>

          <Form.Item name="shift_date_from" className="mb-0">
            <DatePicker placeholder="Từ ngày" format="DD/MM/YYYY" className="w-48" />
          </Form.Item>

          <Form.Item name="shift_date_to" className="mb-0">
            <DatePicker placeholder="Đến ngày" format="DD/MM/YYYY" className="w-48" />
          </Form.Item>

          <Form.Item className="mb-0">
            <Button type="primary" icon={<Filter size={16} />} onClick={handleFilter}>Lọc</Button>
          </Form.Item>

          <Form.Item className="mb-0">
            <Button icon={<RotateCcw size={16} />} onClick={handleResetFilter}>Reset</Button>
          </Form.Item>
        </Form>
      </div>

      {/* Table */}
      {isFetching ? (
        <div className="flex justify-center py-20">
          <Spin size="large" />
        </div>
      ) : (
        <Fragment>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={listShifts}
            pagination={{
              current: parseInt(queryConfig.page as string) || 1,
              total: paginated?.total,
              pageSize: parseInt(queryConfig.per_page as string) || 15,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} ca`,
              onChange: (page, pageSize) => {
                const params = new URLSearchParams(window.location.search)
                params.set("page", page.toString())
                params.set("per_page", pageSize.toString())
                window.history.pushState({}, "", `${window.location.pathname}?${params.toString()}`)
                window.dispatchEvent(new PopStateEvent("popstate"))
              }
            }}
            scroll={{
              y: "calc(100vh - 500px)",
              x: true
            }}
            bordered
          />
        </Fragment>
      )}

      {/* Create/Edit Modal */}
      <Modal
        title={isEditMode ? "Chỉnh sửa Ca làm việc" : "Thêm Ca làm việc mới"}
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={handleCloseModal}>Hủy</Button>
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {isEditMode ? "Cập nhật" : "Tạo mới"}
            </Button>
          </div>
        }
        width={600}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="name"
            label="Tên ca"
            rules={[
              { required: true, message: "Vui lòng nhập tên ca!" },
              { min: 2, message: "Tên ca phải có ít nhất 2 ký tự" }
            ]}
          >
            <Input placeholder="VD: Ca sáng, Ca tối..." />
          </Form.Item>

          <Form.Item
            name="shift_date"
            label="Ngày (tùy chọn)"
            help="Để trống nếu đây là template, chọn ngày cho ca cụ thể"
          >
            <DatePicker className="w-full" format="DD/MM/YYYY" placeholder="Chọn ngày" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="start_time"
              label="Giờ bắt đầu"
              rules={[{ required: true, message: "Vui lòng chọn giờ bắt đầu!" }]}
            >
              <TimePicker
                className="w-full"
                format="HH:mm"
                placeholder="Chọn giờ"
                minuteStep={15}
              />
            </Form.Item>

            <Form.Item
              name="end_time"
              label="Giờ kết thúc"
              rules={[{ required: true, message: "Vui lòng chọn giờ kết thúc!" }]}
            >
              <TimePicker
                className="w-full"
                format="HH:mm"
                placeholder="Chọn giờ"
                minuteStep={15}
              />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
