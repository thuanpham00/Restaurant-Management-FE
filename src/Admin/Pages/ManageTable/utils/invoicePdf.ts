import pdfMake from "pdfmake/build/pdfmake"
import pdfFonts from "pdfmake/build/vfs_fonts"
import type { Content, TDocumentDefinitions } from "pdfmake/interfaces"
import JsBarcode from "jsbarcode"
import { toast } from "react-toastify"
import type { InvoiceDetail, InvoicePromotion } from "src/Types/invoicePayment.type"
import type { TableSessionDetail, TableSessionOrder } from "src/Types/tableSession.type"

type PdfMakeWithVfs = typeof pdfMake & {
  vfs: Record<string, string>
  addVirtualFileSystem?: (vfs: Record<string, string>) => void
}

type PdfFontsModule = {
  vfs?: Record<string, string>
  pdfMake?: { vfs?: Record<string, string> }
  default?: {
    vfs?: Record<string, string>
    pdfMake?: { vfs?: Record<string, string> }
  }
}

let isPdfMakeReady = false

const ensurePdfMakeReady = () => {
  if (isPdfMakeReady) return

  const pdfMakeWithVfs = pdfMake as PdfMakeWithVfs
  const fontsModule = pdfFonts as PdfFontsModule & Record<string, unknown>

  const extractVfs = (source: unknown): Record<string, string> | undefined => {
    if (!source || typeof source !== "object") return undefined

    const recordSource = source as Record<string, unknown>
    const nestedVfs = recordSource.vfs
    if (nestedVfs && typeof nestedVfs === "object") {
      const typedNested = nestedVfs as Record<string, unknown>
      if (Object.keys(typedNested).length > 0 && Object.values(typedNested).every((value) => typeof value === "string")) {
        return typedNested as Record<string, string>
      }
    }

    if (Object.keys(recordSource).length > 0 && Object.values(recordSource).every((value) => typeof value === "string")) {
      return recordSource as Record<string, string>
    }

    return undefined
  }

  const defaultModule = fontsModule.default as Record<string, unknown> | undefined
  const candidateSources: unknown[] = [
    fontsModule,
    fontsModule.pdfMake,
    defaultModule,
    defaultModule?.pdfMake,
    (fontsModule as Record<string, unknown>)?.pdfmake,
    defaultModule?.pdfmake
  ]

  for (const source of candidateSources) {
    const vfsCandidate = extractVfs(source)
    if (vfsCandidate) {
      pdfMakeWithVfs.vfs = vfsCandidate
      if (typeof pdfMakeWithVfs.addVirtualFileSystem === "function") {
        pdfMakeWithVfs.addVirtualFileSystem(vfsCandidate)
      }
      isPdfMakeReady = true
      break
    }
  }

  if (!isPdfMakeReady && typeof (fontsModule as { addVirtualFileSystem?: Function }).addVirtualFileSystem === "function") {
    const virtualFileSystem: Record<string, string> = {}
    ;(fontsModule as { addVirtualFileSystem: (target: Record<string, unknown>) => void }).addVirtualFileSystem(
      virtualFileSystem
    )
    if (Object.keys(virtualFileSystem).length > 0) {
      pdfMakeWithVfs.vfs = virtualFileSystem
      isPdfMakeReady = true
    }
  }

  if (!isPdfMakeReady) {
    console.error("pdfmake fonts could not be initialized: missing virtual file system data.")
  }
}

if (typeof window !== "undefined") {
  ensurePdfMakeReady()
}

export const toNumber = (value: string | number | null | undefined) => {
  const numeric = Number(value ?? 0)
  return Number.isNaN(numeric) ? 0 : numeric
}

export const formatCurrency = (value: string | number | null | undefined) => {
  return toNumber(value).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND"
  })
}

export const formatDateTime = (isoDate: string | null | undefined) => {
  if (!isoDate) return "Chưa xác định"

  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) {
    return isoDate
  }

  return date.toLocaleString("vi-VN")
}

const formatDateOnly = (isoDate: string | null | undefined) => {
  if (!isoDate) return null

  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toLocaleDateString("vi-VN")
}

export const formatPromotionDateRange = (start?: string | null, end?: string | null) => {
  const startLabel = formatDateOnly(start)
  const endLabel = formatDateOnly(end)

  if (startLabel && endLabel) {
    return `${startLabel} - ${endLabel}`
  }

  if (startLabel) {
    return `Từ ${startLabel}`
  }

  if (endLabel) {
    return `Đến ${endLabel}`
  }

  return "Không xác định"
}

export const getPaymentMethodLabel = (method: number) => {
  switch (method) {
    case 0:
      return "Tiền mặt"
    case 1:
      return "Chuyển khoản"
    default:
      return "Khác"
  }
}

export const getPaymentStatusMeta = (status: number) => {
  switch (status) {
    case 0:
      return { text: "Không thành công", color: "error" as const }
    case 1:
      return { text: "Thành công", color: "success" as const }
    default:
      return { text: "Không xác định", color: "default" as const }
  }
}

export const resolvePromotionDiscountLabel = (
  discountValue: string,
  promotionInfo?: InvoicePromotion["promotion"]
) => {
  if (!discountValue) return formatCurrency(0)

  const numericValue = toNumber(discountValue)

  if (promotionInfo?.discount_percent) {
    return `${numericValue.toLocaleString("vi-VN")}%`
  }

  return formatCurrency(numericValue)
}

const computeFinancialInfo = (invoiceDetail: InvoiceDetail) => {
  const subtotal = toNumber(invoiceDetail.total_amount)
  const discount = Math.max(toNumber(invoiceDetail.discount), 0)
  const tax = Math.max(toNumber(invoiceDetail.tax), 0)
  const finalAmount = toNumber(invoiceDetail.final_amount)
  const discountAmount = subtotal * (discount / 100)
  const subtotalAfterDiscount = subtotal - discountAmount

  const payments = invoiceDetail.payments ?? []

  const totalPaid =
    payments.filter((payment) => payment.status === 1).reduce((sum, payment) => sum + toNumber(payment.amount), 0) || 0

  const remaining = Math.max(finalAmount - totalPaid, 0)
  const taxAmount = Math.max(finalAmount - subtotalAfterDiscount, 0)

  return {
    subtotal,
    tax,
    finalAmount,
    discount,
    totalPaid,
    remaining,
    discountAmount,
    subtotalAfterDiscount,
    taxAmount
  }
}

const generateBarcodeDataUrl = (value: string) => {
  return new Promise<string>((resolve, reject) => {
    try {
      if (typeof document === "undefined") {
        throw new Error("Document is not available in the current execution context.")
      }
      const canvas = document.createElement("canvas")
      JsBarcode(canvas, value, {
        format: "CODE128",
        displayValue: false,
        margin: 0,
        background: "#ffffff"
      })
      resolve(canvas.toDataURL("image/png"))
    } catch (error) {
      reject(error)
    }
  })
}

type ExportInvoicePdfOptions = {
  invoiceDetail: InvoiceDetail
  paidAmount: number
  paymentMethod: number
  tableSessionDetail?: TableSessionDetail | null
  tableInfo?: {
    tableName?: string | null
    tableNumber?: number | null
  }
  orderItems?: TableSessionOrder["items"]
  orderSubtotal?: number
  appliedPromotions?: InvoicePromotion[]
}

export const exportInvoicePdf = async ({
  invoiceDetail,
  paidAmount,
  paymentMethod,
  tableSessionDetail,
  tableInfo,
  orderItems,
  orderSubtotal,
  appliedPromotions
}: ExportInvoicePdfOptions) => {
  ensurePdfMakeReady()

  if (!isPdfMakeReady) {
    toast.error("Không thể khởi tạo trình tạo PDF.")
    return
  }

  try {
    const barcodeDataUrl = await generateBarcodeDataUrl(invoiceDetail.id)
    const paymentMethodLabel = getPaymentMethodLabel(paymentMethod)
    const financialInfo = computeFinancialInfo(invoiceDetail)
    const resolvedOrderItems = orderItems ?? []
    const orderRows = resolvedOrderItems.map((item, index) => [
      { text: `${index + 1}`, alignment: "center" as const },
      { text: item.dish?.dish_name || "Không xác định", alignment: "left" as const },
      { text: item.quantity != null ? `${item.quantity}` : "-", alignment: "center" as const },
      { text: formatCurrency(item.item_price), alignment: "right" as const },
      { text: formatCurrency(item.total_price), alignment: "right" as const }
    ])

    const ordersTotalFromItems = resolvedOrderItems.reduce((sum, item) => sum + toNumber(item.total_price), 0)

    const promotionList = Array.isArray(appliedPromotions)
      ? appliedPromotions
      : Array.isArray(invoiceDetail.invoice_promotions)
      ? (invoiceDetail.invoice_promotions as InvoicePromotion[])
      : []

    const promotionTableRows = promotionList.map((promotion) => {
      const discountLabel = resolvePromotionDiscountLabel(promotion.discount_value, promotion.promotion)
      const validity = formatPromotionDateRange(promotion.promotion?.start_date, promotion.promotion?.end_date)
      return [
        promotion.promotion?.code || `#${promotion.promotion_id}`,
        discountLabel,
        validity,
        formatDateTime(promotion.applied_at)
      ]
    })

    const summaryTableBody = [
      ["Tạm tính", formatCurrency(financialInfo.subtotal)],
      ["Giảm giá", `${financialInfo.discount}% (${formatCurrency(financialInfo.discountAmount)})`],
      ["Thuế VAT", `${financialInfo.tax}% (${formatCurrency(financialInfo.taxAmount)})`],
      ["Tổng tiền phải thu", formatCurrency(financialInfo.finalAmount)],
      ["Đã nhận", formatCurrency(paidAmount)],
      ["Phương thức thanh toán", paymentMethodLabel]
    ]

    const fallbackOrderTotal = toNumber(orderSubtotal)
    const resolvedOrderTotal = ordersTotalFromItems > 0 ? ordersTotalFromItems : fallbackOrderTotal

    if (resolvedOrderTotal > 0) {
      summaryTableBody.splice(1, 0, ["Tổng món ăn", formatCurrency(resolvedOrderTotal)])
    }

    const leftMetaColumn: Content[] = [
      { text: `Mã hóa đơn: #${invoiceDetail.id}`, style: "metaText" },
      { text: `Phiên bàn: ${invoiceDetail.table_session_id}`, style: "metaText" }
    ]

    if (tableInfo?.tableName) {
      leftMetaColumn.push({ text: `Bàn: ${tableInfo.tableName}`, style: "metaText" })
    } else if (tableInfo?.tableNumber !== undefined && tableInfo?.tableNumber !== null) {
      leftMetaColumn.push({ text: `Bàn số: ${tableInfo.tableNumber}`, style: "metaText" })
    }

    if (invoiceDetail.operation_type) {
      leftMetaColumn.push({ text: `Thao tác: ${invoiceDetail.operation_type}`, style: "metaText" })
    }

    const rightMetaColumn: Content[] = [
      { text: `Ngày tạo: ${formatDateTime(invoiceDetail.created_at)}`, style: "metaText", alignment: "right" },
      { text: `Cập nhật: ${formatDateTime(invoiceDetail.updated_at)}`, style: "metaText", alignment: "right" }
    ]

    const metadataSection: Content = {
      columns: [{ stack: leftMetaColumn }, { stack: rightMetaColumn }]
    }

    const orderSection: Content = orderRows.length
      ? {
          table: {
            headerRows: 1,
            widths: [30, "*", 40, 90, 90],
            body: [
              [
                { text: "STT", style: "tableHeader", alignment: "center" },
                { text: "Món ăn", style: "tableHeader" },
                { text: "SL", style: "tableHeader", alignment: "center" },
                { text: "Đơn giá", style: "tableHeader", alignment: "right" },
                { text: "Thành tiền", style: "tableHeader", alignment: "right" }
              ],
              ...orderRows
            ]
          },
          layout: "lightHorizontalLines"
        }
      : { text: "Không có dữ liệu món ăn được ghi nhận.", italics: true }

    const promotionSection: Content = promotionTableRows.length
      ? {
          table: {
            headerRows: 1,
            widths: ["*", "auto", "auto", "auto"],
            body: [
              [
                { text: "Mã", style: "tableHeader" },
                { text: "Giá trị", style: "tableHeader", alignment: "right" as const },
                { text: "Hiệu lực", style: "tableHeader" },
                { text: "Áp dụng", style: "tableHeader" }
              ],
              ...promotionTableRows.map((row) => [
                { text: row[0] },
                { text: row[1], alignment: "right" as const },
                { text: row[2] },
                { text: row[3] }
              ])
            ]
          },
          layout: "lightHorizontalLines"
        }
      : { text: "Không áp dụng khuyến mãi.", italics: true }

    const summarySection: Content = {
      table: {
        widths: ["*", "auto"],
        body: summaryTableBody.map(([label, value]) => [
          { text: label, style: "summaryLabel" },
          { text: value, style: "summaryValue", alignment: "right" }
        ])
      },
      layout: "lightHorizontalLines"
    }

    const payments = invoiceDetail.payments ?? []

    const paymentHistorySection: Content[] = []
    if (payments.length > 0) {
      paymentHistorySection.push(
        { text: "Lịch sử thanh toán", style: "sectionTitle", margin: [0, 16, 0, 8] },
        {
          table: {
            headerRows: 1,
            widths: ["auto", "auto", "auto", "*"],
            body: [
              [
                { text: "#", style: "tableHeader", alignment: "center" },
                { text: "Số tiền", style: "tableHeader", alignment: "right" },
                { text: "Trạng thái", style: "tableHeader" },
                { text: "Thời gian", style: "tableHeader" }
              ],
              ...payments.map((payment, index) => [
                { text: `${index + 1}`, alignment: "center" as const },
                { text: formatCurrency(payment.amount), alignment: "right" as const },
                { text: getPaymentStatusMeta(payment.status).text },
                { text: formatDateTime(payment.paid_at) }
              ])
            ]
          },
          layout: "lightHorizontalLines"
        }
      )
    }

    const contentSections: Content[] = [
      { image: barcodeDataUrl, fit: [220, 60], alignment: "center", margin: [0, 32, 0, 8] },
      { text: "HÓA ĐƠN THANH TOÁN", style: "header", margin: [0, 0, 0, 12] },
      metadataSection,
      { text: "Thông tin khách hàng", style: "sectionTitle", margin: [0, 16, 0, 8] },
      {
        table: {
          widths: ["30%", "*"],
          body: [
            ["Tên khách hàng", tableSessionDetail?.customer_name || "Khách lẻ"],
            ["Số điện thoại", tableSessionDetail?.customer_phone || "---"],
            ["Địa chỉ", tableSessionDetail?.customer_address || "---"]
          ]
        },
        layout: "lightHorizontalLines"
      },
      { text: "Chi tiết món ăn", style: "sectionTitle", margin: [0, 16, 0, 8] },
      orderSection,
    //   { text: "Khuyến mãi áp dụng", style: "sectionTitle", margin: [0, 16, 0, 8] },
    //   promotionSection,
      { text: "Tổng kết thanh toán", style: "sectionTitle", margin: [0, 16, 0, 8] },
      summarySection,
    //   ...paymentHistorySection,
      { text: "Cảm ơn quý khách và hẹn gặp lại!", style: "footer", margin: [0, 20, 0, 0] }
    ]

    const docDefinition: TDocumentDefinitions = {
      info: {
        title: `Hoa_don_${invoiceDetail.id}`
      },
      content: contentSections,
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          alignment: "center"
        },
        metaText: {
          fontSize: 11
        },
        sectionTitle: {
          fontSize: 13,
          bold: true,
          color: "#1f2937"
        },
        tableHeader: {
          bold: true,
          color: "#111827"
        },
        summaryLabel: {
          fontSize: 11,
          color: "#374151"
        },
        summaryValue: {
          fontSize: 11,
          bold: true
        },
        footer: {
          italics: true,
          alignment: "center",
          color: "#6b7280"
        }
      },
      defaultStyle: {
        fontSize: 11,
        lineHeight: 1.35
      }
    }

    pdfMake.createPdf(docDefinition).download(`Hoa_don_${invoiceDetail.id}.pdf`)
  } catch (error) {
    console.error("Failed to generate invoice PDF", error)
    toast.error("Không thể tạo file PDF. Vui lòng thử lại.")
  }
}
