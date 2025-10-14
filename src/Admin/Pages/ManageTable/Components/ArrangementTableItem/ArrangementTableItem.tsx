/* eslint-disable @typescript-eslint/no-explicit-any */
import { Col, Modal, Radio, Tag } from "antd"
import { useState } from "react"
import { assets } from "src/Assets/assets"
import { DiningTable } from "src/Types/diningTable.type"
import FullCalendar from "@fullcalendar/react"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { diningTableAPI } from "src/Apis"

export default function ArrangementTableItem({
  table,
  index,
  onSelect,
  selectedTableId
}: {
  table: DiningTable
  index: number
  selectedTableId: string | null
  onSelect: (id: string | null) => void
}) {
  const [viewCalendar, setViewCalendar] = useState(false)

  const { data } = useQuery({
    queryKey: ["listReservationTableByIdTable", table.id],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)
      return diningTableAPI.getListReservationTableSessionByIdTable(table.id)
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
            : "#ff9800" // Pending
  }))

  return (
    <Col xs={24} sm={12} md={8} lg={12} xl={12}>
      <button
        className={`w-full 
      block relative rounded-xl overflow-hidden cursor-pointer transition duration-300 hover:shadow-lg h-52
      border-4 
      ${selectedTableId === table.id ? " border-green-500 shadow-[0_0_14px_#22c55e]" : "border-transparent"}
      ${!table.table_available ? "opacity-80 cursor-not-allowed" : ""}
    `}
        onClick={() => {
          if (!table.table_available) return
          onSelect(selectedTableId === table.id ? null : table.id)
        }}
      >
        {/* Background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${index % 2 === 1 ? assets.rectangles.restaurant : assets.rectangles.restaurant2})`
          }}
        ></div>

        <div className="absolute inset-0 bg-black/50"></div>

        <div className="relative z-10 p-4 pt-2 text-white flex items-start justify-start flex-col">
          <Radio
            className="absolute top-2 right-2"
            checked={selectedTableId === table.id}
            disabled={!table.table_available}
          />

          <h2 className="mb-2 text-xl font-semibold text-shadow">
            Bàn {table.table_number} - {table.id}
          </h2>

          <div className="flex flex-col items-start gap-1">
            <p>
              <strong>Sức chứa:</strong> {table.capacity} người
            </p>
            <p>
              <strong>Trạng thái:</strong>{" "}
              <Tag color={table.table_available ? "green" : "red"} className="text-[14px] font-semibold">
                {table.table_available ? "Trống" : "Không khả dụng"}
              </Tag>
            </p>
          </div>

          {!table.table_available && table.reason && (
            <div className="absolute bottom-[-26px] left-0 right-0 bg-black/70 text-white px-3 py-2 text-center text-xs rounded-t-md">
              <span className="font-medium">Lý do:</span> <span>{table.reason}</span>
            </div>
          )}

          <button
            className="mt-2 text-xs p-2 bg-blue-500 hover:bg-blue-400 duration-200 rounded-md"
            onClick={(e) => {
              e.stopPropagation()
              setViewCalendar(true)
            }}
          >
            Xem lịch
          </button>

          <Modal
            width={1200}
            title={`Lịch đặt bàn ${table.table_number} - ${table.id} | Giờ hoạt động (10:00AM - 0:00PM)`}
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
              eventClick={(info: any) => {
                console.log("Clicked reservation:", info.event)
              }}
            />
          </Modal>
        </div>
      </button>
    </Col>
  )
}
