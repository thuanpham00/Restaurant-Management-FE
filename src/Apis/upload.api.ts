import Http from "src/Helpers/http"

export const MediaAPI = {
  uploadImageDish: (file: File, dish_id: string) => {
    const formData = new FormData()
    formData.append("image", file)
    formData.append("dish_id", dish_id)
    return Http.post("/api/auth/uploads/image-dish", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    })
  },

  uploadImageUser: (file: File, user_id: string) => {
    const formData = new FormData()
    formData.append("image", file)
    formData.append("user_id", user_id)
    return Http.post("/api/auth/uploads/image-user", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    })
  }
}
