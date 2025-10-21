/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button, Col, message, Modal, Row } from "antd"
import { TableSession } from "src/Types/tableSession.type"
import TableSessionItem from "../TableSessionItem"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { tableSessionAPI } from "src/Apis"
import { useAppStore } from "src/StateGlobal/zustand"
import { queryParamConfigTableSessions } from "src/Types/queryParams.type"
import { isError400 } from "src/Helpers/utils"
import { ErrorResponse } from "src/Types/utils.type"
import { AppAbility, useAuthorization } from "src/Authorization"

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
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([])
  const [mainSessionId, setMainSessionId] = useState<string | null>(null)
  const { can } = useAuthorization()
  const canManageTables = can(AppAbility.TABLES_MANAGE)

  const clearSelection = useCallback(() => {
    setSelectedSessionIds([])
    setMainSessionId(null)
  }, [])

  const {
    mutate: triggerMergeTable,
    isPending: isMerging,
    reset: resetMergeState
  } = useMutation({
    mutationFn: (body: { source_session_ids: string[]; target_session_id: string; employee_id: string }) =>
      tableSessionAPI.mergeTableSession(body),
    onSuccess: () => {
      message.success("Gộp bàn thành công 🎉")
      queryClient.invalidateQueries({ queryKey: ["listTableSession", queryConfig] })
      clearSelection()
      setMergedTable(false)
    },
    onError: (error) => {
      if (isError400<ErrorResponse<any>>(error)) {
        message.error((error.response?.data.message ?? "Không thể gộp bàn") + " ❌")
      }
    }
  })

  const mainTableSession = useMemo(() => {
    if (!mainSessionId) return null
    return listTableSessionActiveData.find((table) => table.session_id === mainSessionId) ?? null
  }, [listTableSessionActiveData, mainSessionId])

  const mainDiningTableId = mainTableSession?.dining_table_id ?? null

  const subTableDiningIds = useMemo(() => {
    if (selectedSessionIds.length === 0) return []
    return selectedSessionIds
      .map((sessionId) =>
        listTableSessionActiveData.find((table) => table.session_id === sessionId)?.dining_table_id
      )
      .filter((id): id is string => Boolean(id) && id !== mainDiningTableId)
  }, [selectedSessionIds, listTableSessionActiveData, mainDiningTableId])

  const selectedCount = selectedSessionIds.length

  useEffect(() => {
    if (selectedSessionIds.length === 0) {
      if (mainSessionId !== null) {
        setMainSessionId(null)
      }
      return
    }

    if (!mainSessionId || !selectedSessionIds.includes(mainSessionId)) {
      setMainSessionId(selectedSessionIds[0])
    }
  }, [selectedSessionIds, mainSessionId])

  useEffect(() => {
    if (!mergedTable) {
      if (selectedSessionIds.length > 0 || mainSessionId) {
        clearSelection()
      }
      resetMergeState()
    }
  }, [mergedTable, selectedSessionIds.length, mainSessionId, clearSelection, resetMergeState])

  useEffect(() => {
    if (!canManageTables && mergedTable) {
      setMergedTable(false)
    }
  }, [canManageTables, mergedTable, setMergedTable])

  const handleMergeTable = () => {
    if (!canManageTables) {
      message.warning("Bạn không có quyền quản lý bàn.")
      return
    }
    if (selectedCount < 2) {
      message.warning("Cần chọn ít nhất 2 bàn để gộp!")
      return
    }

    if (!mainSessionId) {
      message.warning("Vui lòng xác định bàn chính cho nhóm gộp!")
      return
    }

    if (!employeeId) {
      message.warning("Không tìm thấy thông tin nhân viên thực hiện thao tác.")
      return
    }

    const body = {
      target_session_id: mainSessionId,
      source_session_ids: selectedSessionIds.filter((sessionId) => sessionId !== mainSessionId),
      employee_id: String(employeeId)
    }

    triggerMergeTable(body)
  }

  const handleCloseModal = () => {
    clearSelection()
    resetMergeState()
    setMergedTable(false)
  }

  if (!canManageTables) {
    return null
  }

  return (
    <Modal
      width={1400}
      title="Gộp bàn"
      closable={{ "aria-label": "Custom Close Button" }}
      open={mergedTable === true && canManageTables}
      onCancel={handleCloseModal}
      footer={null}
      destroyOnClose
      style={{ top: 40 }}
    >
      <>
        <div className="mb-3 flex flex-wrap items-center justify-between text-sm text-gray-600">
          <span>
            Đã chọn: <span className="font-semibold text-gray-800">{selectedCount}</span> bàn
          </span>
          {mainTableSession && (
            <span>
              Bàn chính: <span className="font-semibold text-gray-800">Bàn {mainTableSession.table_number}</span>
            </span>
          )}
        </div>
        <p className="mb-4 text-xs text-gray-500">
          Chọn tối thiểu 2 bàn. Bàn được chọn đầu tiên sẽ trở thành bàn chính, nhấp lại vào một bàn để bỏ chọn.
        </p>
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
                  mergeTableSessionSelected={selectedSessionIds}
                  setMergeTableSessionSelected={setSelectedSessionIds}
                  mainTableId={mainDiningTableId}
                  subTables={subTableDiningIds}
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
            type="primary"
            danger
            onClick={handleMergeTable}
            loading={isMerging}
            disabled={selectedCount < 2 || isMerging}
          >
            Tiến hành gộp bàn
          </Button>
        </div>
      </>
    </Modal>
  )
}
