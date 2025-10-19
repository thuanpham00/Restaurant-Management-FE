import Http from "src/Helpers/http"
import { Dish } from "src/Types/dish.type"
import { SuccessResponse } from "src/Types/utils.type"

export const detailMenuAPI = {
  getDishById: (id: string) => {
    return Http.get<SuccessResponse<Dish>>(`/api/dishes/${id}`)
  }
}