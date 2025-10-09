import { User } from "./user.type"

export type SuccessResponse<Data> = {
  status: string
  message: string
  data: Data
}

export type RegisterResponse = {
  email: string;
  expires_at: string;
};

export type GoogleAuthResponse = {
  url: string;
  provider: "google";
};

export type ErrorResponse<Data> = {
  status: string
  message: string
  errors?: Data
}

export type MessageResponse = {
  message: string
}

export type AuthResponse = {
  user: User
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

export type Statistics = {
  restaurants: number
  new_dishes: number
  years_experience: number
}

export type Chef = {
  id: string
  name: string
  avatar: string | null
}

export interface Dish {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string | null;
  is_active: boolean;
  reviews_avg_rating: number | null;
  category?: {
    id: string;
    name: string;
  } | null;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  dishes: Dish[];
}

export type Promotion = {
  id: string;
  code: string;
  description: string;
  discount_percent: number;
  start_date: string;
  end_date: string;
  usage_limit: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SpecialMenu {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  dishes: Dish[];
}

export type DiningTable = {
  table_number: number
  capacity: number
  is_active: boolean
  id: string
  updated_at: string
  created_at: string
}

export type CategoryDishes = {
  [x: string]: any
  id: string
  name: string
  desc: string
  dishes_count: number
  updated_at: string
  created_at: string
}

export type Dishes = {
  id: string
  name: string
  price: string
  desc: string
  category_id: string
  cooking_time: number
  image: null
  is_active: boolean
  created_at: string
  updated_at: string
  category: {
    id: string
    name: string
    desc: string
    created_at: string
    updated_at: string
  }
  reviews_avg_rating?: number;
}

export type Menus = {
  id: string
  name: string
  description: string
  version: number
  is_active: boolean
  created_at: string
  updated_at: string
  items_count: number
}

export type TableSession = {
  dining_table_id: string
  table_number: number
  capacity: number
  is_active: number
  session_id: string | null
  session_type: number | null
  session_status: number | null
  started_at: string | null
  ended_at: string | null
}

export type TableSessionDetail = {
  dining_table_id: string
  session_id: string
  session_type: number
  session_status: number
  started_at: string
  reservation_reserved_at: string
  ended_at: null
  reservation_number_of_people: number
  reservation_notes: string
  customer_id: string
  customer_name: string
  customer_gender: string
  customer_phone: string
  customer_address: string
}

export type TableSessionOrder = {
  order_id: string
  table_session_id: string
  order_status: number
  total_amount: string
  items: {
    order_item_id: string
    quantity: number
    item_price: string
    total_price: string
    item_status: number
    notes: string
    prepared_by: string
    served_at: null
    cancelled_reason: null
    dish: {
      dish_id: string
      dish_name: string
      dish_price: string
      dish_desc: string
      cooking_time: number
      image: null
      dish_active: boolean
      category_name: string
      category_desc: string
    }
  }[]
}

export type HistoryTableSession = {
  session_id: string
  table_id: string
  table_number: number
  table_capacity: number
  session_type: number
  session_status: number
  started_at: string
  ended_at: string
  customer_id: string
  employee_id: string
  reservation: {
    reservation_id: string
    customer_id: string
    reserved_at: string
    number_of_people: number
    status: number
    notes: string
    customer_name: string
    customer_phone: string
    customer_gender: string
    customer_address: string
  }
}

export type HistoryTableSessionDetail = {
  session_id: string
  table_id: string
  table_number: number
  table_capacity: number
  session_type: number
  session_status: number
  started_at: string
  ended_at: string
  customer_id: string
  employee_id: string
  reservation: {
    reservation_id: string
    customer_id: string
    reserved_at: string
    number_of_people: number
    status: number
    notes: string
    customer_name: string
    customer_phone: string
    customer_gender: string
    customer_address: string
  }
  orders: {
    order_id: string
    status: number
    total_amount: string
    items: {
      order_item_id: string
      quantity: number
      price: string
      total_price: string
      status: number
      notes: string
      dish: {
        dish_id: string
        name: string
        price: string
        desc: string
        cooking_time: number
        image: string | null
      }
    }[]
  }[]
}

export type MenuDetailListItem = {
  menu: {
    id: string
    name: string
  }
  items: {
    id: string
    menu_id: string
    dish_id: string
    dish_name: string
    price_base: string
    price: string
    notes: string
    dish_image: string
  }[]
}

export type AddDishToMenu = {
  id: string
  name: string
  price: string
  image: string
}

export type Reservation = {
  id: string
  customer_id: string
  reserved_at: string
  number_of_people: number
  status: number
  notes: string
  created_at: string
  updated_at: string
  customer: {
    id: string
    full_name: string
    phone: string
    gender: string
    address: string
    membership_level: number
    user_id: string
    created_at: string
    updated_at: string
    membership_label: string
  }
}

export type PaginationLink = {
  url: string | null
  label: string
  page: number | null
  active: boolean
}

export type PaginatedResponse<T> = {
  current_page: number
  data: T[]
  first_page_url: string
  from: number
  last_page: number
  last_page_url: string
  links: PaginationLink[]
  next_page_url: string | null
  path: string
  per_page: number
  prev_page_url: string | null
  to: number
  total: number
}
