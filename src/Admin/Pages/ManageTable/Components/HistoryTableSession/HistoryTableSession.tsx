/* eslint-disable @typescript-eslint/no-explicit-any */
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { Button, Modal, Spin, Table } from "antd"
import { History } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"
import { tableSessionAPI } from "src/Apis/Admin"
import { HistoryTableSession as HistoryTableSessionType } from "src/Types/utils.type"
import { renderSessionStatus, renderSessionType } from "../../Pages/TableDetail/TableDetail"

export default function HistoryTableSession({ idDiningTable }: { idDiningTable: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 5 })

  const showModal = () => {
    setIsModalOpen(true)
  }

  const { data, isFetching } = useQuery({
    queryKey: ["listHistoryTableSession", idDiningTable],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)
      return tableSessionAPI.getListHistoryTableSessionByIdTable(idDiningTable)
    },
    retry: 0,
    enabled: Boolean(isModalOpen),
    staleTime: 3 * 60 * 1000,
    placeholderData: keepPreviousData
  })

  const listHistoryTableSession = (data?.data?.data || []) as HistoryTableSessionType[]

  const columns = [
    {
      title: <div className="text-center">Mã phiên</div>,
      dataIndex: "session_id",
      key: "session_id",
      render: (val: string) => <div className="text-center">{val}</div>
    },
    {
      title: <div className="text-center">Số bàn</div>,
      dataIndex: "table_number",
      key: "table_number",
      render: (val: string) => <div className="text-center">{val}</div>
    },
    {
      title: "Loại phiên",
      dataIndex: "session_type",
      key: "session_type",
      render: (val: number) => <div className="text-center">{renderSessionType(val)}</div>
    },
    {
      title: <div className="text-center">Trạng thái phiên</div>,
      dataIndex: "session_status",
      key: "session_status",
      render: (val: number) => <div className="text-center">{renderSessionStatus(val)}</div>
    },
    {
      title: <div className="text-center">Bắt đầu</div>,
      dataIndex: "started_at",
      key: "started_at",
      render: (val: string | null) => <div className="text-center">{val || "-"}</div>
    },
    {
      title: <div className="text-center">Kết thúc</div>,
      dataIndex: "ended_at",
      key: "ended_at",
      render: (val: string | null) => <div className="text-center">{val || "-"}</div>
    },
    {
      title: <div className="text-center">Số người đặt</div>,
      dataIndex: ["reservation", "number_of_people"],
      key: "number_of_people",
      render: (val: string) => <div className="text-center">{val}</div>
    },
    {
      title: <div className="text-center">Tên người đặt</div>,
      dataIndex: ["reservation", "customer_name"],
      key: "customer_name",
      render: (val: string) => <div className="text-center">{val}</div>
    },
    {
      title: <div className="text-center">Hành động</div>,
      key: "action",
      render: (_: any, record: any) => (
        <Link
          to={`/admin/tables/${idDiningTable}/session/${record.session_id}`}
          state={{
            idDiningTable: idDiningTable,
            idTableSession: record.session_id
          }}
          className="text-blue-500 text-center block"
        >
          Chi tiết
        </Link>
      )
    }
  ]

  return (
    <div className="mt-4 flex justify-start">
      <Button
        type="primary"
        icon={<History size={16} />}
        style={{
          backgroundColor: "#ef4444",
          borderColor: "#ef4444",
          width: "100%"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#f87171"
          e.currentTarget.style.borderColor = "#f87171"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#ef4444"
          e.currentTarget.style.borderColor = "#ef4444"
        }}
        onClick={showModal}
      >
        Lịch sử phiên bàn
      </Button>

      <Modal
        title="Lịch sử phiên bàn"
        closable={{ "aria-label": "Custom Close Button" }}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={false}
        width={1300}
      >
        {isFetching ? (
          <div className="flex justify-center items-center py-10">
            <Spin size="large" tip="Đang tải dữ liệu...">
              <div style={{ minHeight: 100, width: 300, marginTop: 10 }} />
            </Spin>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={listHistoryTableSession}
            rowKey="session_id"
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: listHistoryTableSession.length,
              onChange: (page, pageSize) => setPagination({ current: page, pageSize })
            }}
          />
        )}
      </Modal>
    </div>
  )
}
