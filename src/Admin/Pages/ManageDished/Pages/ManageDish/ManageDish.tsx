/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Pagination, Table, Tag } from "antd"
import { isUndefined, omitBy } from "lodash"
import { Helmet } from "react-helmet-async"
import { useNavigate, useSearchParams } from "react-router-dom"
import NavigateBack from "src/Admin/Components/NavigateBack"
import { adminAPI } from "src/Apis/admin.api"
import { assets } from "src/Assets/assets"
import useQueryParams from "src/Hook/useQueryParams"
import { queryParamConfigCategoryDish } from "src/Types/queryParams.type"

export default function ManageDish() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const queryParams: queryParamConfigCategoryDish = useQueryParams()
  const queryConfig: queryParamConfigCategoryDish = omitBy(
    {
      page: queryParams.page || "1",
      limit: queryParams.limit || "5",
      desc: queryParams.desc,
      name: queryParams.name
    },
    isUndefined
  )

  const { data, isFetching } = useQuery({
    queryKey: ["listDishCategory", queryConfig],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)
      return adminAPI.dishes.getList(queryConfig, controller.signal)
    },
    retry: 0
  })

  const paginated = data?.data.data
  const listDish = paginated?.data

  const columns = [
    {
      title: <div className="text-left">Mã món ăn</div>,
      dataIndex: "id",
      key: "id",
      render: (val: string) => <div className="text-left">{val}</div>
    },
    {
      title: "Món ăn",
      dataIndex: ["dish", "dish_name"],
      key: "dish_name",
      render: (_: any, record: any) => (
        <div className="flex items-center gap-2">
          {record.image ? (
            <img src={record.image} alt={record.name} className="w-12 h-12 rounded-md object-cover" />
          ) : (
            <img src={assets.rectangles.Burger} alt={record.name} className="w-12 h-12 rounded-md object-cover" />
          )}
          <div>
            <p className="font-medium">{record.name}</p>
          </div>
        </div>
      )
    },
    {
      title: "Giá",
      dataIndex: "price",
      key: "price",
      width: 100,
      render: (price: string) => <span>{Number(price).toLocaleString()} đ</span>
    },
    {
      title: "Thời gian nấu",
      dataIndex: "cooking_time",
      key: "cooking_time",
      render: (time: number) => <span>{time} phút</span>
    },
    {
      title: "Danh mục",
      dataIndex: ["category", "name"],
      key: "category"
    },
    {
      title: "Trạng thái",
      dataIndex: "is_active",
      key: "is_active",
      render: (active: boolean) => (active ? <Tag color="green">Hoạt động</Tag> : <Tag color="red">Ngừng</Tag>)
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      render: (value: string) => <div className="text-left">{new Date(value).toLocaleString()}</div>
    },
    {
      title: "Ngày cập nhật",
      dataIndex: "updated_at",
      key: "updated_at",
      render: (value: string) => <div className="text-left">{new Date(value).toLocaleString()}</div>
    }
  ]

  const [searchParams, setSearchParams] = useSearchParams()
  const handlePaginationChange = (page: number, pageSize: number) => {
    searchParams.set("page", page.toString())
    searchParams.set("limit", pageSize.toString())
    setSearchParams(searchParams) // trigger re-render → useQuery tự refetch
  }

  return (
    <div>
      <Helmet>
        <title>Danh sách món ăn</title>
        <meta name="description" content="Đây là trang Restaurant Management - Quản lý bàn" />
      </Helmet>
      <NavigateBack />
      <h1 className="text-2xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 my-2">
        Danh sách món ăn
      </h1>

      <Table
        rowKey="id"
        dataSource={listDish}
        loading={isFetching}
        columns={columns}
        pagination={false}
        bordered
        rowClassName={(record, index) =>
          index % 2 === 0
            ? "bg-[#f2f2f2] hover:bg-blue-50 transition-colors"
            : "bg-white hover:bg-blue-50 transition-colors"
        }
      />

      <div style={{ marginTop: 16, textAlign: "center", display: "flex", justifyContent: "flex-end" }}>
        <Pagination
          current={parseInt(queryConfig.page as string)}
          total={paginated?.total}
          pageSize={parseInt(queryConfig.limit as string)}
          onChange={handlePaginationChange}
          showSizeChanger
          pageSizeOptions={["5", "10", "20", "50"]}
        />
      </div>
    </div>
  )
}
