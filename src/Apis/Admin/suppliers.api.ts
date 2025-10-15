import Http from "src/Helpers/http"
import { SuccessResponse, PaginatedResponse } from "src/Types/utils.type"
import { Supplier, SupplierFormInput, SupplierCreateInput, queryParamConfigSupplier } from "src/Types/supplier.type"

export const suppliersAPI = {
  getList: (params: queryParamConfigSupplier, signal: AbortSignal) => {
    // Convert array parameters to Laravel format with [] suffix
    const processedParams: any = {}
    
    Object.keys(params).forEach(key => {
      const value = params[key as keyof queryParamConfigSupplier]
      if (key === 'ingredient_ids' && Array.isArray(value)) {
        // Laravel expects ingredient_ids[] for array params
        processedParams['ingredient_ids[]'] = value
      } else if (value !== undefined) {
        processedParams[key] = value
      }
    })

    return Http.get<SuccessResponse<PaginatedResponse<Supplier>>>(
      `/api/suppliers`,
      { params: processedParams, signal }
    )
  },

  getDetail: (id: string) => {
    return Http.get<SuccessResponse<Supplier>>(`/api/suppliers/${id}`)
  },

  create: (data: SupplierCreateInput) => {
    return Http.post<SuccessResponse<Supplier>>(`/api/suppliers`, data)
  },

  update: (id: string, data: SupplierFormInput) => {
    return Http.put<SuccessResponse<Supplier>>(`/api/suppliers/${id}`, data)
  },

  delete: (id: string) => {
    return Http.delete<SuccessResponse<void>>(`/api/suppliers/${id}`)
  }
}
