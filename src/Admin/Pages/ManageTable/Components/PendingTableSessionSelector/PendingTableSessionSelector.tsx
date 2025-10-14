import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button, Card, List, Modal, Spin } from "antd"
import { Clock } from "lucide-react"
import { Link } from "react-router-dom"
import { toast } from "react-toastify"
import { Fragment } from "react/jsx-runtime"
import { tableSessionAPI } from "src/Apis"
import { HistoryTableSession } from "src/Types/tableSession.type"

type Props = {
  listPendingTableSession: HistoryTableSession[]
  hasSessionPending: boolean
  setHasSessionPending: React.Dispatch<React.SetStateAction<boolean>>
  isFetchingListPendingTableSession: boolean
  idDiningTable: string
}

export default function PendingTableSessionSelector({
  listPendingTableSession,
  hasSessionPending,
  setHasSessionPending,
  isFetchingListPendingTableSession,
  idDiningTable
}: Props) {
  const queryClient = useQueryClient()
  const updateStatusTableSessionMutation = useMutation({
    mutationFn: (idTS: string) => {
      return tableSessionAPI.updateStatusTableSession(idTS)
    }
  })

  const handleServeClick = (idTableSession: string) => {
    Modal.confirm({
      title: "Xác nhận phục vụ",
      content: "Bạn có chắc chắn muốn phục vụ phiên bàn này không?",
      okText: "Xác nhận",
      cancelText: "Hủy",
      maskClosable: true,
      onOk: () => {
        updateStatusTableSessionMutation.mutate(idTableSession, {
          onSuccess: () => {
            toast.success("Cập nhật phiên bàn thành công", {
              autoClose: 1500
            })
            setHasSessionPending(true)
            queryClient.invalidateQueries({ queryKey: ["detailTableSession", idDiningTable] })
          }
        })
      },
      onCancel: () => {
        console.log("Hủy phục vụ")
      }
    })
  }

  return (
    <div className="pending-session-container p-4 bg-[#fff] border border-gray-200 rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4">Phiên bàn đang chờ</h2>

      {hasSessionPending === false && (
        <Fragment>
          {isFetchingListPendingTableSession ? (
            <div className="flex justify-center items-center flex-col h-[200px]">
              <Spin tip="Đang tải dữ liệu..." size="large" spinning={isFetchingListPendingTableSession}>
                <div style={{ minHeight: 100, width: 300, marginTop: 10 }} />
              </Spin>
            </div>
          ) : (
            <List
              grid={{ gutter: 16, column: 3 }}
              dataSource={listPendingTableSession}
              renderItem={(session) => (
                <List.Item key={session.session_id}>
                  <Card
                    title={`Bàn ${session.table_number} - Phiên ${session.session_id}`}
                    extra={<Clock size={16} className="text-gray-500" />}
                    // onClick={() => onSelectSession(session.session_id)}
                    className="cursor-pointer"
                  >
                    <p>Số người: {session.reservation?.number_of_people || "N/A"}</p>
                    <p>Khách: {session.reservation?.customer_name || "Khách vãng lai"}</p>
                    <p>
                      Ngày đặt:{" "}
                      {session.reservation?.reserved_at
                        ? new Date(session.reservation.reserved_at).toLocaleString()
                        : "N/A"}
                    </p>
                    <div className="flex items-center justify-end gap-2 mt-2">
                      <Link
                        to={`/admin/tables/${idDiningTable}/session/${session.session_id}`}
                        state={{
                          idDiningTable,
                          idTableSession: session.session_id
                        }}
                        style={{ padding: 0, color: "#ef233c", display: "block" }}
                      >
                        Chi tiết
                      </Link>
                      <Button
                        type="primary"
                        style={{
                          backgroundColor: "#38b000", // xanh lá tươi
                          borderColor: "#38b000"
                        }}
                        onClick={() => handleServeClick(session.session_id)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#70d444"
                          e.currentTarget.style.borderColor = "#70d444"
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#38b000"
                          e.currentTarget.style.borderColor = "#38b000"
                        }}
                      >
                        Phục vụ
                      </Button>
                    </div>
                  </Card>
                </List.Item>
              )}
            />
          )}
        </Fragment>
      )}
    </div>
  )
}
