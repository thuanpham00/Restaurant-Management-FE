import Http from "src/Helpers/http"

/**
 * Media/Upload API
 * Handles file uploads for various entities (dishes, users, etc.)
 */
export const mediaAPI = {
  /**
   * Upload image for a dish
   * @param file - Image file to upload
   * @param dish_id - ID of the dish
   */
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

  /**
   * Upload image for a user profile
   * @param file - Image file to upload
   * @param user_id - ID of the user
   */
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
