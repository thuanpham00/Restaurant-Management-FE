/* eslint-disable @typescript-eslint/no-explicit-any */
import { Checkbox, Col, Tag } from "antd"
import { Link } from "react-router-dom"
import { assets } from "src/Assets/assets"
import { path } from "src/Constants/path"
import { TableSessionStatus, TableSessionType } from "src/Types/product.type"
import { TableSession } from "src/Types/tableSession.type"

export default function TableSessionItem({
  table,
  index,
  type_show,
  mergeTableSessionSelected,
  setMergeTableSessionSelected
}: {
  table: TableSession
  index: number
  mergeTableSessionSelected: any[]
  setMergeTableSessionSelected: React.Dispatch<React.SetStateAction<any[]>>
  type_show?: string
}) {
  const getStatusTag = (table: TableSession) => {
    if (!table.session_id)
      return (
        <Tag color="green" className="text-[14px] font-semibold">
          Trống
        </Tag>
      )

    switch (table.session_status) {
      case TableSessionStatus.Pending:
        return (
          <Tag color="orange" className="text-[14px] font-semibold">
            Đang chờ
          </Tag>
        )
      case TableSessionStatus.Active:
        return (
          <Tag color="blue" className="text-[14px] font-semibold">
            Đang phục vụ
          </Tag>
        )
      case TableSessionStatus.Completed:
        return (
          <Tag color="gray" className="text-[14px] font-semibold">
            Hoàn tất
          </Tag>
        )
      case TableSessionStatus.Cancelled:
        return (
          <Tag color="red" className="text-[14px] font-semibold">
            Hủy
          </Tag>
        )
      default:
        return <Tag className="text-[14px] font-semibold">Không xác định</Tag>
    }
  }

  const getTypeTag = (table: TableSession) => {
    if (!table.session_type && table.session_type !== 0) return null
    switch (table.session_type) {
      case TableSessionType.Offline:
        return (
          <Tag color="default" className="text-[14px] font-semibold">
            Offline
          </Tag>
        )
      case TableSessionType.Merge:
        return (
          <Tag color="gold" className="text-[14px] font-semibold">
            Ghép bàn
          </Tag>
        )
      case TableSessionType.Reservation:
        return (
          <Tag color="cyan" className="text-[14px] font-semibold">
            Đặt trước
          </Tag>
        )
      case TableSessionType.Split:
        return (
          <Tag color="magenta" className="text-[14px] font-semibold">
            Tách bàn
          </Tag>
        )
      default:
        return null
    }
  }

  const CardContent = () => (
    <div
      className={`block relative rounded-xl overflow-hidden cursor-pointer transition duration-300 hover:shadow-lg ${type_show === "merge_table" ? "h-64" : "h-52"} $
      `}
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${index % 2 == 1 ? assets.rectangles.restaurant : assets.rectangles.restaurant2})`
        }}
      ></div>

      <div className="absolute inset-0 bg-black/50"></div>

      <div className="relative z-10 p-4 text-white">
        {type_show === "merge_table" && (
          <Checkbox
            className="absolute top-2 right-2"
            checked={mergeTableSessionSelected.some((item) => item === table.session_id)}
            onChange={() => {
              setMergeTableSessionSelected((prev) => [...prev, table.session_id])
            }}
          />
        )}

        {type_show === "merge_table" ? (
          ""
        ) : (
          <div
            className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold shadow-md
        ${table.is_active === 1 ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}
          >
            {table.is_active === 1 ? "Mở" : "Ngừng"}
          </div>
        )}

        <h2 className="mb-4 text-xl text-left font-semibold text-shadow">Bàn {table.table_number}</h2>

        <div className="flex flex-col justify-start items-start gap-1">
          <p>
            <strong>Sức chứa:</strong> {table.capacity} người
          </p>
          <p>
            <strong>Trạng thái:</strong> {getStatusTag(table)}
          </p>
          {table.session_id && (
            <p>
              <strong>Loại phiên:</strong> {getTypeTag(table)}
            </p>
          )}
          {table.started_at && (
            <p>
              <strong>Bắt đầu:</strong> {table.started_at}
            </p>
          )}

          {type_show === "merge_table" && (
            <Link
              to={`${path.AdminTables}/${table.dining_table_id}`}
              state={{ tableName: table.table_number, dataTable: table }}
              style={{ width: 64, background: "#1677ff", borderRadius: 4, padding: 4, textAlign: "center" }}
            >
              Chi tiết
            </Link>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <Col xs={24} sm={12} md={8} lg={6} xl={6}>
      {type_show === "merge_table" ? (
        <button
          className={`block w-full rounded-xl overflow-hidden cursor-pointer transition duration-300 hover:shadow-lg ${mergeTableSessionSelected?.some((item) => item === table.session_id) ? " border-green-500 shadow-[0_0_14px_#22c55e]" : "border-transparent"}`}
          onClick={() => {
            const findTableSession = mergeTableSessionSelected.find((item) => item === table.session_id)
            if (findTableSession) {
              setMergeTableSessionSelected((prev) => prev.filter((item) => item !== table.session_id))
            } else {
              setMergeTableSessionSelected((prev) => [...prev, table.session_id])
            }
          }}
        >
          <CardContent />
        </button>
      ) : (
        <Link
          to={`${path.AdminTables}/${table.dining_table_id}`}
          state={{ tableName: table.table_number, dataTable: table }}
        >
          <CardContent />
        </Link>
      )}
    </Col>
  )
}
