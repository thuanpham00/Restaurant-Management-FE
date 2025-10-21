/* eslint-disable @typescript-eslint/no-explicit-any */
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { Form, Select, Button, Tag, message } from "antd"
import { useState } from "react"
import { promotionAPI } from "src/Apis/Admin/promotion.api"
import { AppAbility, useAuthorization } from "src/Authorization"

export interface PromotionSelect {
  id: string
  name: string
  discountValue: number // % hoặc giá tiền
}

interface Props {
  setListPromotionApply: React.Dispatch<
    React.SetStateAction<
      | {
          promotion_id: string
          discount_value: number
        }[]
      | null
    >
  >
  setTotalPercentage: React.Dispatch<React.SetStateAction<number>>
}

const PromotionForm = ({ setListPromotionApply, setTotalPercentage }: Props) => {
  const [form] = Form.useForm()
  const [appliedPromotions, setAppliedPromotions] = useState<PromotionSelect[]>([])
  const { can } = useAuthorization()
  const canViewInvoices = can(AppAbility.INVOICES_VIEW)
  const canManageInvoices = can(AppAbility.INVOICES_MANAGE)

  const { data } = useQuery({
    queryKey: ["listPromotion"],
    queryFn: () => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 10000)
      return promotionAPI.getPromotionAll()
    },
    enabled: canViewInvoices,
    retry: 0,
    staleTime: 3 * 60 * 1000,
    placeholderData: keepPreviousData
  })

  const listPromotionSelect = (data?.data.data || []) as PromotionSelect[]

  const applyPromotion = (values: any) => {
    if (!canManageInvoices) {
      message.warning("Bạn không có quyền áp dụng khuyến mãi!")
      return
    }
    const selectedPromotionId = values.promotion
    if (!selectedPromotionId) {
      message.warning("Vui lòng chọn khuyến mãi!")
      return
    }

    const promotion = listPromotionSelect.find((p) => p.id === selectedPromotionId)
    if (!promotion) return

    if (appliedPromotions.some((p) => p.id === selectedPromotionId)) {
      message.info("Khuyến mãi này đã được áp dụng!")
      return
    }

    // Thêm vào danh sách đã áp dụng
    setAppliedPromotions((prev) => [
      ...prev,
      { id: promotion.id, name: promotion.name, discountValue: promotion.discountValue } // ví dụ discountValue = 10%
    ])

    // applyPromotionToInvoice(promotion.value)
    setTotalPercentage((prev) => Number(prev) + Number(promotion.discountValue))

    setListPromotionApply((prev) => [
      ...(prev || []),
      { promotion_id: promotion.id, discount_value: Number(promotion.discountValue) }
    ])

    form.resetFields()
    message.success(`Đã áp dụng khuyến mãi: ${promotion.name}`)
  }

  const removePromotion = (promotionId: string) => {
    if (!canManageInvoices) {
      message.warning("Bạn không có quyền xóa khuyến mãi!")
      return
    }
    setAppliedPromotions((prev) => prev.filter((p) => p.id !== promotionId))

    setListPromotionApply((prev) =>
      (prev || []).filter((p) => p.promotion_id !== appliedPromotions.find((ap) => ap.id === promotionId)?.id)
    )

    const removed = appliedPromotions.find((p) => p.id === promotionId)
    if (removed) {
      setTotalPercentage((prev) => Number(prev - Number(removed.discountValue)))
    }
    message.success("Đã xóa khuyến mãi")
  }

  if (!canViewInvoices) {
    return null
  }

  return (
    <div className="mt-2">
      <Form form={form} layout="inline" onFinish={applyPromotion}>
        <Form.Item name="promotion" style={{ flex: 1 }}>
          <Select placeholder="Áp dụng khuyến mãi" style={{ minWidth: 200 }} disabled={!canManageInvoices}>
            {listPromotionSelect.map((p) => (
              <Select.Option key={p.id} value={p.id}>
                {p.name} - {p.discountValue}%
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" disabled={!canManageInvoices}>
            Apply
          </Button>
        </Form.Item>
      </Form>

      {/* Hiển thị danh sách khuyến mãi đã áp dụng */}
      <div style={{ marginTop: 8 }}>
        {appliedPromotions.map((p) => (
          <Tag
            key={p.id}
            closable={canManageInvoices}
            onClose={() => removePromotion(p.id)}
            style={{ marginBottom: 4 }}
          >
            {p.name} ({p.discountValue}%)
          </Tag>
        ))}
      </div>
    </div>
  )
}

export default PromotionForm
