import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { Button, Modal, Spin, Table } from "antd"
import { History } from "lucide-react"
import { useState } from "react"
import { adminAPI } from "src/Apis/admin.api"
import { HistoryTableSession as HistoryTableSessionType } from "src/Types/utils.type"

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
      return adminAPI.tableSession.getListHistoryTableSessionByIdTable(idDiningTable)
    },
    retry: 0,
    enabled: Boolean(isModalOpen),
    staleTime: 3 * 60 * 1000,
    placeholderData: keepPreviousData
  })

  const listHistoryTableSession = (data?.data?.data || []) as HistoryTableSessionType[]

  const columns = [
    {
      title: "Mã phiên",
      dataIndex: "session_id",
      key: "session_id"
    },
    {
      title: "Số bàn",
      dataIndex: "table_number",
      key: "table_number"
    },
    {
      title: "Loại phiên",
      dataIndex: "session_type",
      key: "session_type",
      render: (val: number) => {
        const types = ["Offline", "Merge", "Reservation", "Split"]
        return types[val] || "Unknown"
      }
    },
    {
      title: "Trạng thái phiên",
      dataIndex: "session_status",
      key: "session_status",
      render: (val: number) => {
        const statuses = ["Pending", "Active", "Paying", "Completed", "Cancelled"]
        return statuses[val] || "Unknown"
      }
    },
    {
      title: "Bắt đầu",
      dataIndex: "started_at",
      key: "started_at"
    },
    {
      title: "Kết thúc",
      dataIndex: "ended_at",
      key: "ended_at",
      render: (val: string | null) => val || "-"
    },
    {
      title: "Số người đặt",
      dataIndex: ["reservation", "number_of_people"],
      key: "number_of_people"
    },
    {
      title: "Ghi chú",
      dataIndex: ["reservation", "notes"],
      key: "notes",
      render: (val: string) => val || "-"
    },
    {
      title: "Thời gian đặt",
      dataIndex: ["reservation", "reserved_at"],
      key: "reserved_at"
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
        width={1200}
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
