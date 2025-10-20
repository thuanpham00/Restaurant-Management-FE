import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button, Card, List, Modal, Spin, Tag } from "antd"
import { CalendarDays, Clock, Monitor } from "lucide-react"
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

function PendingTableSessionSelector({
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

  const updateStatusTableSessionCancelMutation = useMutation({
    mutationFn: (idTS: string) => {
      return tableSessionAPI.updateStatusCancelTableSession(idTS)
    }
  })

  const handleUpdateTableSessionStatus = (idTableSession: string, type: "serve" | "cancel") => {
    const isServe = type === "serve"

    Modal.confirm({
      title: isServe ? "Xác nhận phục vụ" : "Xác nhận hủy phiên",
      content: isServe
        ? "Bạn có chắc chắn muốn phục vụ phiên bàn này không?"
        : "Bạn có chắc chắn muốn hủy phiên bàn này không?",
      okText: "Xác nhận",
      cancelText: "Hủy",
      maskClosable: true,
      onOk: () => {
        const mutation = isServe ? updateStatusTableSessionMutation : updateStatusTableSessionCancelMutation

        mutation.mutate(idTableSession, {
          onSuccess: () => {
            toast.success(isServe ? "Cập nhật phiên bàn thành công" : "Hủy phiên bàn thành công", {
              autoClose: 1500
            })
            if (isServe) setHasSessionPending(true)

            queryClient.invalidateQueries({ queryKey: ["detailTableSession", idDiningTable] }) // cập nhật chi tiết phiên bàn
            queryClient.invalidateQueries({ queryKey: ["listPendingTableSession", idDiningTable] }) // danh sách hàng chờ phiên
            queryClient.invalidateQueries({ queryKey: ["listReservationTableByIdTable", idDiningTable] }) // reload danh sách phiên (lịch đặt bàn khi xếp bàn)
          }
        })
      },
      onCancel: () => {
        console.log(isServe ? "Hủy phục vụ" : "Hủy thao tác hủy phiên")
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
              renderItem={(session) => {
                // 🟩 Xác định kiểu phiên bàn
                let sessionTypeTag = <Tag color="default">Không xác định</Tag>

                if (session.session_type === 0) {
                  sessionTypeTag = (
                    <Tag
                      color="blue"
                      icon={<Monitor size={14} />}
                      style={{
                        border: "1px solid #0d6efd",
                        background: "rgba(13, 110, 253, 0.1)",
                        color: "#0d6efd",
                        fontWeight: 500,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "2px 8px",
                        borderRadius: 8
                      }}
                    >
                      Offline
                    </Tag>
                  )
                } else if (session.session_type === 2) {
                  sessionTypeTag = (
                    <Tag
                      color="orange"
                      icon={<CalendarDays size={14} />}
                      style={{
                        fontWeight: 500,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "2px 8px",
                        borderRadius: 8
                      }}
                    >
                      Đặt trước
                    </Tag>
                  )
                }

                return (
                  <List.Item key={session.session_id} className="h-[260px]">
                    <Card
                      title={
                        <div className="flex items-center justify-between">
                          <span>
                            Bàn {session.table_number} - Phiên {session.session_id}
                          </span>
                        </div>
                      }
                      extra={<Clock size={16} className="text-gray-500" />}
                      className="cursor-pointer h-full flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-4">
                          <span>Loại phiên: </span>
                          {sessionTypeTag}
                        </div>
                        <p className="mt-2">Khách: {session.reservation?.customer_name || "Khách vãng lai"}</p>
                        {/* {session.session_type !== 0 && (
                        )} */}
                        <div>
                          <p className="mt-2">Số người: {session.reservation?.number_of_people || "Không xác định"}</p>
                          <p className="mt-2">
                            Ngày đặt:{" "}
                            {session.reservation?.reserved_at
                              ? new Date(session.reservation.reserved_at).toLocaleString()
                              : "Không xác định"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-4">
                        <div>
                          <Button type="primary">
                            <Link
                              to={`/admin/tables/${idDiningTable}/session/${session.session_id}`}
                              state={{
                                idDiningTable,
                                idTableSession: session.session_id
                              }}
                              style={{
                                color: "white",
                                display: "block"
                              }}
                            >
                              Chi tiết
                            </Link>
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="primary"
                            style={{
                              backgroundColor: "#ef233c",
                              borderColor: "#ef233c"
                            }}
                            onClick={() => handleUpdateTableSessionStatus(session.session_id, "cancel")}
                          >
                            Hủy phiên
                          </Button>
                          <Button
                            type="primary"
                            style={{
                              backgroundColor: "#38b000",
                              borderColor: "#38b000"
                            }}
                            onClick={() => handleUpdateTableSessionStatus(session.session_id, "serve")}
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
                      </div>
                    </Card>
                  </List.Item>
                )
              }}
            />
          )}
        </Fragment>
      )}
    </div>
  )
}

export default PendingTableSessionSelector
