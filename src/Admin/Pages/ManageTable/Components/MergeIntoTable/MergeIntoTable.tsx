/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button, Col, message, Modal, Row } from "antd"
import { TableSession } from "src/Types/tableSession.type"
import TableSessionItem from "../TableSessionItem"
import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { tableSessionAPI } from "src/Apis"
import { useAppStore } from "src/StateGlobal/zustand"
import { queryParamConfigTableSessions } from "src/Types/queryParams.type"
import { isError400 } from "src/Helpers/utils"
import { ErrorResponse } from "src/Types/utils.type"

export default function MergeIntoTable({
  listTableSessionActiveData,
  mergedTable,
  setMergedTable,
  queryConfig
}: {
  listTableSessionActiveData: TableSession[]
  mergedTable: boolean
  setMergedTable: React.Dispatch<React.SetStateAction<boolean>>
  queryConfig: queryParamConfigTableSessions
}) {
  const queryClient = useQueryClient()
  const { employeeId } = useAppStore()
  const [mergeTableSessionSelected, setMergeTableSessionSelected] = useState<any[]>([])
  const [mainTableId, setMainTableId] = useState<string | null>(null)

  const mergeTableMutation = useMutation({
    mutationFn: (body: { source_session_ids: string[]; target_session_id: string; employee_id: string }) =>
      tableSessionAPI.mergeTableSession(body),
    onSuccess: () => {
      message.success("Gộp bàn thành công 🎉")
      setMergedTable(false)
      queryClient.invalidateQueries({ queryKey: ["listTableSession", queryConfig] })
    },
    onError: (error) => {
      if (isError400<ErrorResponse<any>>(error)) {
        message.error(error.response?.data.message + " ❌")
      }
    }
  })

  useEffect(() => {
    if (mergeTableSessionSelected.length > 0 && !mainTableId) {
      setMainTableId(mergeTableSessionSelected[0])
    }
    if (mergeTableSessionSelected.length === 0) {
      setMainTableId(null)
    }
  }, [mergeTableSessionSelected, mainTableId])

  const handleMergeTable = () => {
    if (!mainTableId) {
      message.warning("Vui lòng chọn ít nhất 2 bàn để gộp!")
      return
    }
    if (mergeTableSessionSelected.length < 2) {
      message.warning("Cần chọn ít nhất 2 bàn để gộp!")
      return
    }

    const body = {
      target_session_id: mainTableId,
      source_session_ids: mergeTableSessionSelected.filter((id) => id !== mainTableId),
      employee_id: employeeId as string
    }
    mergeTableMutation.mutate(body)
  }

  return (
    <Modal
      width={1400}
      title="Gộp bàn"
      closable={{ "aria-label": "Custom Close Button" }}
      open={mergedTable === true}
      onCancel={() => setMergedTable(false)}
      footer={null}
      style={{ top: 40 }}
    >
      <>
        <Row
          gutter={[16, 16]}
          style={{
            height: 500,
            overflowY: "auto"
          }}
        >
          {listTableSessionActiveData.length > 0 ? (
            listTableSessionActiveData.map((table, index) => (
              <Col key={table.dining_table_id} xs={24} sm={12} md={8} lg={6} xl={6}>
                <TableSessionItem
                  table={table}
                  index={index}
                  type_show="merge_table"
                  mergeTableSessionSelected={mergeTableSessionSelected}
                  setMergeTableSessionSelected={setMergeTableSessionSelected}
                  mainTableId={mainTableId}
                  subTables={mergeTableSessionSelected.filter((id) => id !== mainTableId)}
                />
              </Col>
            ))
          ) : (
            <div className="flex items-center justify-center w-full h-full text-gray-500 text-lg font-medium">
              Không có dữ liệu
            </div>
          )}
        </Row>

        <div className="flex justify-end">
          <Button
            onClick={handleMergeTable}
            className="bg-red-500 hover:!bg-red-600 duration-100 text-white hover:!text-white"
          >
            Tiến hành gộp bàn
          </Button>
        </div>
      </>
    </Modal>
  )
}
