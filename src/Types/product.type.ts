/* eslint-disable @typescript-eslint/no-explicit-any */
export enum StatusProduct {
  "out_of_stock" = "out_of_stock",
  "discontinued" = "discontinued",
  "available" = "available"
}

export type CollectionItemType = {
  _id: string
  name: string
  averageRating: number
  discount: number
  price: number
  isFeatured: string
  medias: {
    url: string
    type: number
  }[]
  banner: {
    url: string
    type: number
  }
  sold: number
  specifications: never[]
  viewCount: number
  reviews: string[]
  category: string[]
  brand: string[]
  status: StatusProduct
}
