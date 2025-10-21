import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { Button, Empty, Pagination, Spin, Table, Tag, Tooltip, Typography } from "antd"
import { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"
import { isUndefined, omitBy } from "lodash"
import { Helmet } from "react-helmet-async"
import { Link, useSearchParams } from "react-router-dom"
import { Fragment, useMemo, useState } from "react"
import NavigateBack from "src/Admin/Components/NavigateBack"
import { invoicePaymentAPI } from "src/Apis/Admin/invoicePayment.api"
import useQueryParams from "src/Hook/useQueryParams"
import { queryParamConfigInvoice } from "src/Types/queryParams.type"
import { ChevronRight, ChevronDown, Maximize2, Minimize2, GitBranch, Eye } from "lucide-react"
import { buildInvoiceTree, InvoiceTreeNode, getAllInvoiceIds, formatCurrency } from "src/Helpers/invoiceTree"
import { AppAbility, PermissionGate, useAuthorization } from "src/Authorization"

const { Text } = Typography

export default function ManageInvoice() {
  const queryParams: queryParamConfigInvoice = useQueryParams()
  const queryConfig: queryParamConfigInvoice = omitBy(
    {
      page: queryParams.page || "1",
      per_page: queryParams.per_page || "20" // Tăng lên để load đủ invoices cho tree
    },
    isUndefined
  )
  const { can } = useAuthorization()
  const canViewInvoices = can(AppAbility.INVOICES_VIEW)

  const { data, isFetching } = useQuery({
    queryKey: ["listInvoice", queryConfig],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)
      return invoicePaymentAPI.getList(queryConfig, controller.signal)
    },
    retry: 0,
    staleTime: 3 * 60 * 1000,
    placeholderData: keepPreviousData
  })

  const paginated = data?.data.data
  const invoiceList = paginated?.data || []

  // ✅ State để quản lý expand/collapse
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([])

  // ✅ Build tree structure từ flat list
  const invoiceTree = useMemo(() => {
    return buildInvoiceTree(invoiceList)
  }, [invoiceList])

  // ✅ Handle expand all / collapse all
  const handleExpandAll = () => {
    const allKeys = getAllInvoiceIds(invoiceTree)
    setExpandedRowKeys(allKeys)
  }

  const handleCollapseAll = () => {
    setExpandedRowKeys([])
  }

  const [searchParams, setSearchParams] = useSearchParams()
  const handlePaginationChange = (page: number, pageSize: number) => {
    searchParams.set("page", page.toString())
    searchParams.set("per_page", pageSize.toString())
    setSearchParams(searchParams) // trigger re-render → useQuery tự refetch
  }

  const columns: ColumnsType<InvoiceTreeNode> = [
    {
      title: "Mã hóa đơn",
      dataIndex: ["invoice", "id"],
      key: "id",
      width: 200,
      render: (text, record) => {
        const isExpanded = expandedRowKeys.includes(record.key)

        return (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            {/* Expand/Collapse Icon - Chỉ hiển thị nếu có children */}
            {record.hasChildren ? (
              <span
                onClick={() => {
                  if (isExpanded) {
                    setExpandedRowKeys(expandedRowKeys.filter((k) => k !== record.key))
                  } else {
                    setExpandedRowKeys([...expandedRowKeys, record.key])
                  }
                }}
                style={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  flexShrink: 0
                }}
              >
                {isExpanded ? <ChevronDown size={16} color="#1890ff" /> : <ChevronRight size={16} color="#1890ff" />}
              </span>
            ) : (
              <span style={{ width: 16, flexShrink: 0 }} /> // Placeholder để align
            )}

            {/* Indent dấu ↳ cho các invoice con */}
            <span style={{ marginLeft: record.level * 16, flexShrink: 0 }}>
              {record.level > 0 && (
                <GitBranch
                  size={14}
                  style={{
                    marginRight: 6,
                    color: "#8c8c8c",
                    verticalAlign: "middle"
                  }}
                />
              )}
            </span>

            {/* Mã hóa đơn */}
            <span className={record.level === 0 ? "font-bold" : "font-medium"} style={{ whiteSpace: "nowrap" }}>
              {text}
            </span>
          </div>
        )
      }
    },
    {
      title: "Mã phiên bàn",
      dataIndex: ["invoice", "table_session_id"],
      key: "table_session_id",
      width: 120
    },
    {
      title: "Tổng tiền gốc",
      key: "totalOriginal",
      width: 150,
      align: "right",
      render: (_, record) => (
        <span className={record.level === 0 ? "font-semibold" : ""}>{formatCurrency(record.totalOriginal)}</span>
      )
    },
    {
      title: () => (
        <Tooltip title="Tổng số tiền đã tách thành các hóa đơn con">
          <span>Đã tách</span>
        </Tooltip>
      ),
      key: "totalSplit",
      width: 150,
      align: "right",
      render: (_, record) => {
        if (record.totalSplit === 0) {
          return <Text type="secondary">-</Text>
        }
        return <span className="text-orange-600 font-medium">{formatCurrency(record.totalSplit)}</span>
      }
    },
    {
      title: () => (
        <Tooltip title="Số tiền còn lại chưa tách (Gốc - Đã tách)">
          <span>Còn lại</span>
        </Tooltip>
      ),
      key: "remaining",
      width: 150,
      align: "right",
      render: (_, record) => {
        if (!record.hasChildren) {
          return <Text type="secondary">-</Text>
        }
        return (
          <span className={record.remaining > 0 ? "text-green-600 font-semibold" : "text-gray-400"}>
            {formatCurrency(record.remaining)}
          </span>
        )
      }
    },
    {
      title: "% Tách",
      key: "split_percentage",
      width: 80,
      align: "center",
      render: (_, record) => {
        if (record.level === 0 || !record.invoice.split_percentage) {
          return <Text type="secondary">-</Text>
        }
        return <Tag color="purple">{record.invoice.split_percentage}%</Tag>
      }
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 150,
      render: (_, record) => {
        const status = record.invoice.status
        let text = ""
        let color: string | undefined = ""

        switch (status) {
          case 0:
            text = "Chưa thanh toán"
            color = "orange"
            break
          case 1:
            text = "Thanh toán 1 phần"
            color = "blue"
            break
          case 2:
            text = "Đã thanh toán"
            color = "green"
            break
          case 3:
            text = "Đã hủy"
            color = "red"
            break
          default:
            text = "Không xác định"
            color = "default"
        }

        return <Tag color={color}>{text}</Tag>
      }
    },
    {
      title: "Ngày tạo",
      key: "created_at",
      width: 150,
      render: (_, record) => dayjs(record.invoice.created_at).format("DD/MM/YYYY HH:mm")
    },
    {
      title: <div className="text-center">Hành động</div>,
      key: "action",
      fixed: "right",
      width: 120,
      render: (_, record) => (
        <PermissionGate ability={AppAbility.INVOICES_VIEW}>
          <Tooltip title="Xem chi tiết">
            <Link to={`/admin/invoices/${record.invoice.id}`} className="text-blue-500 flex items-center justify-center">
              <Eye size={18} className="hover:text-blue-600 transition-colors" />
            </Link>
          </Tooltip>
        </PermissionGate>
      )
    }
  ]

  if (!canViewInvoices) {
    return null
  }

  return (
    <div>
      <Helmet>
        <title>Quản lý hóa đơn</title>
        <meta name="description" content="Đây là trang Restaurant Management - Quản lý bàn" />
      </Helmet>
      <NavigateBack />
      <h1 className="text-2xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 my-2">
        Danh sách hóa đơn
      </h1>

      {isFetching ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column", // để tip xuất hiện bên dưới spinner,
            height: "calc(100vh - 200px)" // chiếm toàn màn hình
          }}
        >
          <Spin tip="Đang tải dữ liệu..." size="large">
            <div style={{ minHeight: 100, width: 300, marginTop: 10 }} />
          </Spin>
        </div>
      ) : invoiceTree.length === 0 ? (
        <Empty description="Không có hóa đơn nào" className="mt-16" />
      ) : (
        <Fragment>
          {/* Expand/Collapse Buttons */}
          <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
            <Button icon={<Maximize2 size={16} />} onClick={handleExpandAll} size="small">
              Mở rộng tất cả
            </Button>
            <Button icon={<Minimize2 size={16} />} onClick={handleCollapseAll} size="small">
              Thu gọn tất cả
            </Button>
            <Text type="secondary" style={{ marginLeft: "auto", alignSelf: "center" }}>
              Tổng: <strong>{invoiceTree.length}</strong> nhóm hóa đơn
            </Text>
          </div>

          <Table
            rowKey="key"
            loading={isFetching}
            columns={columns}
            dataSource={invoiceTree}
            pagination={false}
            bordered={true}
            expandable={{
              expandedRowKeys,
              onExpandedRowsChange: (keys) => setExpandedRowKeys(keys as string[]),
              expandIcon: () => null,
              indentSize: 0
            }}
            rowClassName={(record) => {
              // Root invoices: bold background
              if (record.level === 0) {
                return "bg-blue-50 font-semibold"
              }
              // Child invoices: lighter background with alternating rows
              return record.key.endsWith("1") || record.key.endsWith("3") || record.key.endsWith("5")
                ? "bg-gray-50"
                : "bg-white"
            }}
            scroll={{ x: 1400 }}
          />

          <div style={{ marginTop: 16, textAlign: "center", display: "flex", justifyContent: "flex-end" }}>
            <Pagination
              current={parseInt(queryConfig.page as string)}
              total={paginated?.total}
              pageSize={parseInt(queryConfig.per_page as string)}
              onChange={handlePaginationChange}
              showSizeChanger
              pageSizeOptions={["20", "50", "100"]}
            />
          </div>
        </Fragment>
      )}
    </div>
  )
}
