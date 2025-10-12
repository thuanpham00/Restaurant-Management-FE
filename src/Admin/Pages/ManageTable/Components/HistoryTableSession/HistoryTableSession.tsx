/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button, Modal } from "antd"
import { NotebookTabs } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import FullCalendar from "@fullcalendar/react"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { diningTableAPI } from "src/Apis"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"

export default function HistoryTableSession({
  idDiningTable,
  tableNumber
}: {
  idDiningTable: string
  tableNumber: number
}) {
  const calendarRef = useRef<any>(null)
  const navigate = useNavigate()
  const [viewCalendar, setViewCalendar] = useState(false)

  useEffect(() => {
    if (viewCalendar && calendarRef.current) {
      setTimeout(() => {
        calendarRef.current.getApi().updateSize()
      }, 300) // đợi modal mở animation xong
    }
  }, [viewCalendar])

  const { data } = useQuery({
    queryKey: ["listReservationTableByIdTable", idDiningTable],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)
      return diningTableAPI.getListReservationTableSessionByIdTable(idDiningTable)
    },
    retry: 0,
    staleTime: 3 * 60 * 1000,
    placeholderData: keepPreviousData,
    enabled: Boolean(viewCalendar)
  })

  const listReservationFromTable = data?.data.data

  const calendarEvents = listReservationFromTable?.map((r: any) => ({
    title: `${r.customer_name || "Khách"} - ${r.number_of_people} người`,
    start: r.reserved_at,
    end: r.ended_at || r.reserved_at,
    color:
      r.table_session_status === 1
        ? "#4CAF50" // Active
        : r.table_session_status === 2
          ? "#2196F3" // Completed
          : r.table_session_status === 3
            ? "#f44336" // Cancelled
            : "#ff9800", // Pending
    extendedProps: {
      session_id: r.table_session_id,
      status_table_session: r.table_session_status
    }
  }))

  const handleEventClick = (info: any) => {
    const event = info.event
    if (event.extendedProps.status_table_session === 1) {
      toast.info("Phiên đang phục vụ", { autoClose: 1500 })
      setViewCalendar(false)
    } else {
      navigate(`/admin/tables/${idDiningTable}/session/${event.extendedProps.session_id}`, {
        state: {
          idDiningTable,
          idTableSession: event.extendedProps.session_id
        }
      })
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        type="primary"
        icon={<NotebookTabs size={16} />}
        style={{
          width: "140px"
        }}
        onClick={() => setViewCalendar(true)}
      >
        Lịch đặt bàn
      </Button>

      <Modal
        width={1200}
        title={`Lịch đặt bàn ${tableNumber} - ${idDiningTable} | Giờ hoạt động (10:00AM - 0:00PM)`}
        closable={{ "aria-label": "Custom Close Button" }}
        open={viewCalendar === true}
        onCancel={() => setViewCalendar(false)}
        footer={null}
        style={{ top: 30 }}
      >
        <div className="flex items-center gap-3 mb-3">
          <strong>Ghi chú:</strong>
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#2196F3]"></div> <div>Phiên hoàn thành</div>
          </span>
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#4CAF50]"></div> <div>Phiên đang phục vụ</div>
          </span>
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#ff9800]"></div> <div>Phiên chờ</div>
          </span>
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#f44336]"></div> <div>Phiên đã hủy</div>
          </span>
        </div>

        <FullCalendar
          ref={calendarRef}
          selectMirror={true} // thêm dòng này
          plugins={[timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          allDaySlot={false}
          slotMinTime="10:00:00"
          slotMaxTime="24:00:00"
          selectable={true}
          height={500}
          scrollTime="07:00:00"
          expandRows={true}
          events={calendarEvents}
          eventClick={handleEventClick}
        />
      </Modal>
    </div>
  )
}
