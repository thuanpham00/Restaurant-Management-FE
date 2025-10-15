/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button, Modal, Row } from "antd"
import { Fragment } from "react/jsx-runtime"
import { TableSession } from "src/Types/tableSession.type"
import TableSessionItem from "../TableSessionItem"
import { useState } from "react"

export default function MergeIntoTable({
  listTableSessionActiveData,
  mergedTable,
  setMergedTable
}: {
  listTableSessionActiveData: TableSession[]
  mergedTable: boolean
  setMergedTable: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const [mergeTableSessionSelected, setMergeTableSessionSelected] = useState<any[]>([])
  console.log(mergeTableSessionSelected)

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
          {listTableSessionActiveData.map((table, index) => (
            <Fragment key={table.dining_table_id}>
              <TableSessionItem
                table={table}
                index={index}
                type_show={"merge_table"}
                mergeTableSessionSelected={mergeTableSessionSelected}
                setMergeTableSessionSelected={setMergeTableSessionSelected}
              />
            </Fragment>
          ))}
        </Row>

        <div className="flex justify-end">
          <Button className="bg-red-500 hover:!bg-red-600 duration-100 text-white hover:!text-white">
            Tiến hành gộp bàn
          </Button>
        </div>
      </>
    </Modal>
  )
}
