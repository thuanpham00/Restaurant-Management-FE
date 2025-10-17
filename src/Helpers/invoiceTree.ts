import { Invoice } from "src/Types/invoicePayment.type"

/**
 * Interface cho node trong cây hóa đơn
 */
export interface InvoiceTreeNode {
  key: string // Unique key cho Table (invoice.id)
  invoice: Invoice // Dữ liệu hóa đơn gốc
  children?: InvoiceTreeNode[] // Các hóa đơn con (nếu có)
  level: number // Cấp độ (0 = gốc, 1 = con, 2 = cháu...)
  
  // Calculated fields
  totalOriginal: number // Tổng tiền của hóa đơn này
  totalSplit: number // Tổng tiền đã tách (sum của children)
  remaining: number // Còn lại (original - split)
  hasChildren: boolean // Có children hay không
}

/**
 * Build tree structure từ flat list invoices
 * Dựa vào parent_invoice_id để xác định quan hệ cha-con
 */
export function buildInvoiceTree(invoices: Invoice[]): InvoiceTreeNode[] {
  if (!invoices || invoices.length === 0) return []

  // Step 1: Tạo map để tra cứu nhanh invoice theo id
  const invoiceMap = new Map<string, Invoice>()
  invoices.forEach(inv => invoiceMap.set(inv.id, inv))

  // Step 2: Tạo map lưu children của mỗi invoice
  const childrenMap = new Map<string, string[]>()
  const rootIds = new Set(invoices.map(inv => inv.id))

  invoices.forEach(inv => {
    if (inv.parent_invoice_id && invoiceMap.has(inv.parent_invoice_id)) {
      // Có parent → thêm vào children map
      if (!childrenMap.has(inv.parent_invoice_id)) {
        childrenMap.set(inv.parent_invoice_id, [])
      }
      childrenMap.get(inv.parent_invoice_id)!.push(inv.id)
      
      // Remove khỏi rootIds vì đây là child
      rootIds.delete(inv.id)
    }
  })

  // Step 3: Build tree node recursively
  function buildNode(invoiceId: string, level: number = 0): InvoiceTreeNode {
    const invoice = invoiceMap.get(invoiceId)
    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found in map`)
    }

    const childIds = childrenMap.get(invoiceId) || []
    const children = childIds.map(childId => buildNode(childId, level + 1))

    // Calculate totals
    const totalOriginal = Number(invoice.final_amount)
    const totalSplit = children.reduce((sum, child) => sum + child.totalOriginal, 0)
    const remaining = totalOriginal - totalSplit

    return {
      key: invoice.id,
      invoice,
      children: children.length > 0 ? children : undefined,
      level,
      totalOriginal,
      totalSplit,
      remaining,
      hasChildren: children.length > 0
    }
  }

  // Step 4: Build root nodes và sort theo ngày tạo (mới nhất lên đầu)
  const roots = Array.from(rootIds)
    .map(id => buildNode(id))
    .sort((a, b) => {
      const dateA = new Date(a.invoice.created_at).getTime()
      const dateB = new Date(b.invoice.created_at).getTime()
      return dateB - dateA // Mới nhất lên đầu
    })

  return roots
}

/**
 * Flatten tree thành list (để dễ filter, search)
 */
export function flattenInvoiceTree(nodes: InvoiceTreeNode[]): InvoiceTreeNode[] {
  const result: InvoiceTreeNode[] = []
  
  function traverse(node: InvoiceTreeNode) {
    result.push(node)
    if (node.children) {
      node.children.forEach(child => traverse(child))
    }
  }
  
  nodes.forEach(node => traverse(node))
  return result
}

/**
 * Get all invoice IDs trong tree (để expand all)
 */
export function getAllInvoiceIds(nodes: InvoiceTreeNode[]): string[] {
  const ids: string[] = []
  
  function traverse(node: InvoiceTreeNode) {
    if (node.hasChildren) {
      ids.push(node.key)
    }
    if (node.children) {
      node.children.forEach(child => traverse(child))
    }
  }
  
  nodes.forEach(node => traverse(node))
  return ids
}

/**
 * Format currency VND
 */
export function formatCurrency(value: number | string): string {
  return Number(value).toLocaleString("vi-VN", { 
    style: "currency", 
    currency: "VND" 
  })
}
