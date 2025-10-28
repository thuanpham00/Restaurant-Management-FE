/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Alert,
  Button,
  Col,
  DatePicker,
  Descriptions,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Spin,
  Tag
} from "antd"
import dayjs from "dayjs"
import { Fragment, useEffect, useMemo, useState } from "react"
import { tableSessionAPI } from "src/Apis"
import { DiningTable } from "src/Types/diningTable.type"
import { queryParamConfigTableSessions } from "src/Types/queryParams.type"
import { Reservation } from "src/Types/reservation.type"
import ArrangementTableItem from "../ArrangementTableItem"
import { toast } from "react-toastify"
import { useAppStore } from "src/StateGlobal/zustand"
import { reservationsAPI } from "src/Apis/Admin/reservation.api"
import utc from "dayjs/plugin/utc"
import customParseFormat from "dayjs/plugin/customParseFormat"
import weekday from "dayjs/plugin/weekday"
import localeData from "dayjs/plugin/localeData"
import weekOfYear from "dayjs/plugin/weekOfYear"
import weekYear from "dayjs/plugin/weekYear"
import { useNavigate } from "react-router-dom"
import { AppAbility, useAuthorization } from "src/Authorization"

// Kích hoạt plugin
dayjs.extend(customParseFormat)
dayjs.extend(utc)
dayjs.extend(weekday)
dayjs.extend(localeData)
dayjs.extend(weekOfYear)
dayjs.extend(weekYear)

type SelectReservation = {
  reserved_at: string
  number_of_people: number
}

const renderStatus = (status: number) => {
  switch (status) {
    case 0:
      return <Tag color="gold">Đang chờ duyệt</Tag>
    case 1:
      return <Tag color="blue">Đã xác nhận</Tag>
    case 2:
      return <Tag color="green">Hoàn tất</Tag>
    case 3:
      return <Tag color="red">Đã hủy</Tag>
    default:
      return <Tag color="default">Không xác định</Tag>
  }
}

export default function ArrangementTable({
  queryConfig,
  arrangement,
  setArrangement
}: {
  queryConfig: queryParamConfigTableSessions
  arrangement: Reservation | null
  setArrangement: React.Dispatch<Reservation | null>
}) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { employeeId, setListTablePrepayment, listTablePrepayment } = useAppStore()
  const [selectedReservation, setSelectedReservation] = useState<SelectReservation | null>(null)
  const [filters, setFilters] = useState({ number: "", minCapacity: null as number | null })
  const [filteredTables, setFilteredTables] = useState<DiningTable[]>([])
  const { can } = useAuthorization()
  const canManageTables = can(AppAbility.TABLES_MANAGE)
  const canManageReservations = can(AppAbility.RESERVATIONS_MANAGE)
  const canAssignTable = canManageTables && canManageReservations

  const {
    data: dataListTableArrangement,
    isFetching,
    isError
  } = useQuery({
    queryKey: ["listDataTableArrangement", selectedReservation],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)
      return tableSessionAPI.getListTableArrangement(
        (selectedReservation as SelectReservation).reserved_at,
        (selectedReservation as SelectReservation).number_of_people
      )
    },
    retry: 0,
    enabled: Boolean(selectedReservation) && canAssignTable
  })

  const listTableArrangement = useMemo(() => {
    return (dataListTableArrangement?.data.data || []) as DiningTable[]
  }, [dataListTableArrangement])

  useEffect(() => {
    setFilteredTables(listTableArrangement)
  }, [listTableArrangement])

  useEffect(() => {
    if (!canAssignTable && arrangement !== null) {
      setArrangement(null)
      setSelectedReservation(null)
      return
    }

    if (arrangement !== null) {
      let reservedAt = arrangement.reserved_at
      if (reservedAt) {
        reservedAt = dayjs(reservedAt).format("YYYY-MM-DD HH:mm:ss")
      }
      setSelectedReservation({
        reserved_at: reservedAt,
        number_of_people: arrangement?.number_of_people as number
      })
    }
  }, [arrangement, canAssignTable, setArrangement])

  useEffect(() => {
    if (!canAssignTable) {
      setSelectedTableId(null)
    }
  }, [canAssignTable])

  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)

  const createTableSessionMutation = useMutation({
    mutationFn: ({
      customer_id,
      employee_id,
      reservation_id,
      dining_table_id,
      pre_order
    }: {
      customer_id: string
      employee_id: string
      reservation_id: string
      dining_table_id: string
      pre_order: string
    }) =>
      tableSessionAPI.createTableSessionTypeReservation({
        customer_id,
        dining_table_id,
        employee_id,
        reservation_id,
        pre_order
      }),

    onSuccess: () => {
      toast.success("Tạo phiên bàn thành công", {
        autoClose: 1500
      })
      setArrangement(null)
      setSelectedTableId(null)
      queryClient.invalidateQueries({ queryKey: ["listDataTableArrangement", selectedReservation] })
      queryClient.invalidateQueries({ queryKey: ["listReservation", queryConfig] })
      queryClient.invalidateQueries({ queryKey: ["listCheckAssignedTables", queryConfig] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Cập nhật thất bại ❌", {
        autoClose: 1500
      })
    }
  })

  const handleCreateTableSession = async (type: string) => {
    if (!canAssignTable) {
      toast.warn("Bạn không có quyền xếp bàn.")
      return
    }

    if (type === "no_pre-order") {
      createTableSessionMutation.mutate({
        employee_id: employeeId as string,
        customer_id: arrangement?.customer_id as string,
        dining_table_id: selectedTableId as string,
        reservation_id: arrangement?.id as string,
        pre_order: "no"
      })
    } else if (type === "pre-order") {
      const res = await createTableSessionMutation.mutateAsync({
        employee_id: employeeId as string,
        customer_id: arrangement?.customer_id as string,
        dining_table_id: selectedTableId as string,
        reservation_id: arrangement?.id as string,
        pre_order: "yes"
      })
      const sessionId = res?.data?.data?.table_session?.id as string
      const orderId = res?.data?.data?.order_id
      if (sessionId) {
        setListTablePrepayment(
          listTablePrepayment.some(
            (item) =>
              item.idTableSession === sessionId && item.idDiningTable === selectedTableId && item.orderId === orderId
          )
            ? listTablePrepayment
            : [...listTablePrepayment, { idTableSession: sessionId, idDiningTable: selectedTableId as string, orderId }]
        )
        navigate(`/admin/tables/${selectedTableId}/session/${sessionId}`, {
          state: {
            idDiningTable: selectedTableId,
            idTableSession: sessionId,
            orderId
          }
        })
      }
    }
  }

  // update reservation
  const [checkUpdate, setCheckUpdate] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleCheckUpdate = () => {
    if (!canManageReservations) {
      toast.warn("Bạn không có quyền cập nhật thông tin đặt bàn.")
      return
    }
    if (selectedTableId) {
      toast.error("Đang có phiên bàn nên không thể tiến hành cập nhật!", {
        autoClose: 1500
      })
    } else {
      setCheckUpdate(true)
    }
  }

  const mutationUpdateStatus = useMutation({
    mutationFn: ({
      id,
      reserved_at,
      number_of_people
    }: {
      id: string
      reserved_at: string
      number_of_people: number
    }) =>
      reservationsAPI.update(id, {
        reserved_at,
        number_of_people
      }),
    onSuccess: () => {
      toast.success("Cập nhật thông tin đặt bàn thành công", {
        autoClose: 1500
      })
      setCheckUpdate(false)
      setLoading(false)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Cập nhật thất bại ❌", {
        autoClose: 1500
      })
    }
  })

  const [form] = Form.useForm()

  // update reservation
  const handleUpdate = () => {
    if (!canManageReservations) {
      toast.warn("Bạn không có quyền cập nhật thông tin đặt bàn.")
      return
    }
    const values = form.getFieldsValue()
    const { id, reserved_at, number_of_people } = values

    mutationUpdateStatus.mutate(
      {
        id,
        reserved_at: reserved_at ? dayjs(reserved_at).format("YYYY-MM-DD HH:mm:ss") : "",
        number_of_people
      },
      {
        onSuccess: () => {
          setSelectedReservation({
            reserved_at: dayjs(reserved_at).format("YYYY-MM-DD HH:mm:ss"),
            number_of_people: number_of_people
          })
        }
      }
    )
  }

  const handleFilter = () => {
    const filtered = listTableArrangement.filter((table) => {
      const matchNumber =
        filters.number === "" ||
        (table.table_number && table.table_number.toString().includes(filters.number.toString()))
      const matchCapacity = !filters.minCapacity || (table.capacity && table.capacity >= filters.minCapacity)
      return matchNumber && matchCapacity
    })
    setFilteredTables(filtered)
  }

  // lọc bàn
  const handleReset = () => {
    setFilters({ number: "", minCapacity: null })
    setFilteredTables(listTableArrangement)
  }

  return (
    <Fragment>
      <Modal
        width={1450}
        title="Xếp bàn"
        closable={{ "aria-label": "Custom Close Button" }}
        open={arrangement !== null && canAssignTable}
        onCancel={() => setArrangement(null)}
        footer={null}
        style={{ top: 15, overflow: "hidden" }}
      >
        <Row gutter={12}>
          <Col span={12}>
            {arrangement !== null && (
              <div className="mt-4">
                <Form
                  form={form}
                  layout="vertical"
                  initialValues={{
                    id: arrangement.id,
                    reserved_at: arrangement?.reserved_at ? dayjs(arrangement.reserved_at) : null,
                    number_of_people: arrangement?.number_of_people,
                    full_name: arrangement?.customer?.full_name,
                    phone: arrangement?.customer?.phone,
                    address: arrangement?.customer?.address,
                    notes: arrangement?.notes
                  }}
                >
                  <Descriptions
                    bordered
                    size="middle"
                    column={2}
                    title="Thông tin chi tiết đặt bàn"
                    style={{ fontWeight: 500, background: "#fafafa" }}
                    styles={{ content: { color: "white" } }}
                  >
                    <Descriptions.Item label="Mã đặt bàn">
                      <Form.Item name="id" noStyle>
                        <Input disabled />
                      </Form.Item>
                    </Descriptions.Item>

                    <Descriptions.Item label="Trạng thái">{renderStatus(arrangement.status)}</Descriptions.Item>

                    <Descriptions.Item label="Thời gian đặt">
                      <Form.Item name="reserved_at" noStyle>
                        <DatePicker disabled={!checkUpdate} showTime style={{ width: "100%" }} />
                      </Form.Item>
                    </Descriptions.Item>

                    <Descriptions.Item label="Số lượng khách">
                      <Form.Item name="number_of_people" noStyle>
                        <Input disabled={!checkUpdate} />
                      </Form.Item>
                    </Descriptions.Item>

                    {/* Người đặt */}
                    <Descriptions.Item label="Người đặt">
                      <Form.Item name="full_name" noStyle>
                        <Input disabled />
                      </Form.Item>
                    </Descriptions.Item>

                    {/* Số điện thoại */}
                    <Descriptions.Item label="Số điện thoại">
                      <Form.Item name="phone" noStyle>
                        <Input disabled />
                      </Form.Item>
                    </Descriptions.Item>

                    {/* Địa chỉ */}
                    <Descriptions.Item label="Địa chỉ" span={2}>
                      <Form.Item name="address" noStyle>
                        <Input.TextArea disabled autoSize />
                      </Form.Item>
                    </Descriptions.Item>

                    {/* Ghi chú */}
                    <Descriptions.Item label="Ghi chú" span={2}>
                      <Form.Item name="notes" noStyle>
                        <Input.TextArea disabled autoSize />
                      </Form.Item>
                    </Descriptions.Item>
                  </Descriptions>
                </Form>
                <div className="mt-2">
                  {checkUpdate ? (
                    <div className="flex items-center gap-2 justify-end">
                      <Button danger onClick={() => setCheckUpdate(false)}>
                        Hủy
                      </Button>
                      <Button
                        type="primary"
                        disabled={loading || !canManageReservations}
                        htmlType="submit"
                        onClick={handleUpdate}
                        loading={mutationUpdateStatus.isPending}
                      >
                        Lưu
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-end">
                      <Button
                        type="primary"
                        onClick={handleCheckUpdate}
                        disabled={selectedTableId !== null || !canManageReservations}
                      >
                        Cập nhật
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex justify-end items-center mt-4 gap-2">
                  <Alert
                    message={<span style={{ fontWeight: 500 }}>Lưu ý: Vui lòng chọn bàn</span>}
                    type="warning"
                    showIcon
                    style={{
                      borderRadius: 8,
                      fontSize: 15,
                      background: "#fffbe6"
                    }}
                  />
                  <button
                    className={`p-2 py-1 px-3 rounded-md text-white duration-150 
    ${selectedTableId === null || !canAssignTable ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-400"}`}
                    disabled={selectedTableId === null || !canAssignTable}
                    onClick={() => handleCreateTableSession("no_pre-order")}
                  >
                    Xếp bàn
                  </button>
                  <button
                    className={`p-2 py-1 px-3 rounded-md text-white duration-150 
    ${selectedTableId === null || !canAssignTable ? "bg-gray-400 cursor-not-allowed" : "bg-orange-500 hover:bg-orange-400"}`}
                    disabled={selectedTableId === null || !canAssignTable}
                    onClick={() => handleCreateTableSession("pre-order")}
                  >
                    Xếp bàn & Đặt món
                  </button>
                </div>
              </div>
            )}
          </Col>
          <Col span={12}>
            <span className="text-blue-500 text-lg font-semibold">Lọc bàn tự động dựa trên thông tin đặt bàn</span>

            <Form layout="inline" className="mt-2 mb-4 flex gap-2">
              <Form.Item label="Số bàn">
                <Input
                  placeholder="Nhập số bàn"
                  value={filters.number}
                  onChange={(e) => setFilters((prev) => ({ ...prev, number: e.target.value }))}
                  style={{ width: 120 }}
                />
              </Form.Item>

              <Form.Item label="Sức chứa tối thiểu">
                <InputNumber
                  placeholder="VD: 4"
                  min={1}
                  value={filters.minCapacity}
                  onChange={(val) => setFilters((prev) => ({ ...prev, minCapacity: val }))}
                  style={{ width: 120 }}
                />
              </Form.Item>

              <Form.Item>
                <Button type="primary" onClick={handleFilter}>
                  Lọc
                </Button>
              </Form.Item>

              <Form.Item>
                <Button onClick={handleReset}>Xóa lọc</Button>
              </Form.Item>
            </Form>

            {isFetching ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  flexDirection: "column", // để tip xuất hiện bên dưới spinner
                  height: "calc(100vh - 200px)" // chiếm toàn màn hình
                }}
              >
                <Spin tip="Đang tải dữ liệu..." size="large">
                  <div style={{ minHeight: 100, width: 300, marginTop: 10 }} />
                </Spin>
              </div>
            ) : isError ? (
              <Empty description="Không thể tải danh sách bàn" className="mt-16" />
            ) : filteredTables.length === 0 ? (
              <Empty description="Không có bàn hợp lệ" className="mt-16" />
            ) : (
              <Row gutter={[24, 24]} className="h-[500px] overflow-y-auto mt-2">
                {filteredTables.map((table, index) => (
                  <Fragment key={table.id}>
                    <ArrangementTableItem
                      table={table}
                      index={index}
                      onSelect={(id: string | null) => setSelectedTableId(id)}
                      selectedTableId={selectedTableId}
                    />
                  </Fragment>
                ))}
              </Row>
            )}
          </Col>
        </Row>
      </Modal>
    </Fragment>
  )
}
