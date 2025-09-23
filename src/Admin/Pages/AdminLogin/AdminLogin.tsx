/* eslint-disable @typescript-eslint/no-explicit-any */
import { Beef } from "lucide-react"
import { Helmet } from "react-helmet-async"
import { useForm } from "react-hook-form"
import { Link } from "react-router-dom"
import Button from "src/Components/Button"
import Input from "src/Components/Input"
import { path } from "src/Constants/path"
import { schemaAuth, SchemaAuthType } from "src/Helpers/rule"
import { yupResolver } from "@hookform/resolvers/yup"
import { useMutation } from "@tanstack/react-query"
import { adminAPI } from "src/Apis/admin.api"
import { isError422 } from "src/Helpers/utils"
import { ErrorResponse } from "src/Types/utils.type"
import { useAppStore } from "src/StateGlobal/zustand"
import { toast } from "react-toastify"

type FormData = Pick<SchemaAuthType, "email" | "password"> // kiểu dữ liệu của form
const formData = schemaAuth.pick(["email", "password"]) // validate ở client

export default function AdminLogin() {
  const { setIsAuthenticated, setAvatar, setNameUser, setRole, setUserId } = useAppStore()
  const {
    formState: { errors },
    setError,
    register,
    handleSubmit
  } = useForm<FormData>({ resolver: yupResolver(formData) })

  const loginMutation = useMutation({
    mutationFn: (body: FormData) => {
      return adminAPI.auth.loginAdmin(body)
    }
  })

  // submit đi nó sẽ kiểm tra validation form ở fe -> ok -> gửi req tới server
  const handleSubmitForm = handleSubmit((data) => {
    loginMutation.mutate(data, {
      onSuccess: (response) => {
        toast.success(response.data.message, {
          autoClose: 1000
        })
        setIsAuthenticated(true)
        setAvatar(response.data.data.user.avatar)
        setNameUser(response.data.data.user.name)
        setRole(response.data.data.user.role.name)
        setUserId(response.data.data.user.id)
      },
      onError: (error) => {
        // lỗi từ server trả về
        if (isError422<ErrorResponse<FormData>>(error)) {
          const formError = error.response?.data.errors
          if (formError?.email)
            setError("email", {
              message: (formError.email as any).msg // lỗi 422 từ server trả về
            })
          if (formError?.password) {
            setError("password", {
              message: (formError.password as any).msg
            })
          }
        }
      }
    })
  })

  return (
    <div className="w-full">
      <Helmet>
        <title>Đăng nhập tài khoản - TechZone</title>
        <meta
          name="description"
          content="Đăng nhập tài khoản TechZone để mua sắm nhanh chóng, quản lý đơn hàng và nhận nhiều ưu đãi dành riêng cho bạn."
        />
      </Helmet>

      <div className="p-4 h-full flex items-center flex-col justify-center rounded-tr-lg rounded-br-lg">
        <h1 className="text-xl my-2 font-semibold text-center text-[#000]">Hệ thống quản lý</h1>
        <Link to={path.Home} className="flex items-center justify-center">
          <Beef />
          <span className="text-darkPrimary text-2xl font-bold text-center">Restaurant System</span>
        </Link>
        <h1 className="text-base text-center mt-2 text-[#000]">Đăng nhập</h1>
        <form onSubmit={handleSubmitForm} className="mt-2 w-full">
          <Input
            name="email"
            register={register}
            placeholder="Nhập email"
            messageErrorInput={errors.email?.message}
            nameInput="Email"
          />
          <Input
            name="password"
            register={register}
            placeholder="Nhập mật khẩu"
            messageErrorInput={errors.password?.message}
            nameInput="Mật khẩu"
            type="password"
            classNameError="text-red-500 text-[13px] font-semibold min-h-[2.25rem] block"
            classNameEye="absolute right-2 top-[44%] -translate-y-1/2"
          />
          <Button
            classNameButton="p-2 bg-blue-500 w-full text-white font-semibold rounded-sm hover:bg-blue-500/80 duration-200"
            nameButton="Đăng nhập"
            type="submit"
          />
        </form>
      </div>
    </div>
  )
}
