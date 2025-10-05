// src/Components/Register.tsx
import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LucideUtensils, GithubIcon, Eye, EyeOff } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { clientAPI } from "src/Apis/client.api";
import { schemaRegister, SchemaRegisterType } from "src/Helpers/rule";
import { isError422 } from "src/Helpers/utils";
import { ErrorResponse, RegisterResponse } from "src/Types/utils.type";
import { path } from "src/Constants/path";

type FormData = SchemaRegisterType;

const Register = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    formState: { errors },
    setError,
    register,
    handleSubmit,
  } = useForm<FormData>({ resolver: yupResolver(schemaRegister) });

  const registerMutation = useMutation({
    mutationFn: (body: FormData) => {
      return clientAPI.auth.register(body);
    },
  });

  const handleSubmitForm = handleSubmit((data) => {
    console.log("Form data:", data);
    registerMutation.mutate(data, {
      onSuccess: (response) => {
        toast.success(response.data.message, { autoClose: 3000 });
        navigate(path.Login);
      },
      onError: (error) => {
        if (isError422<ErrorResponse<FormData>>(error)) {
          const formError = error.response?.data.errors;
          if (formError && !Array.isArray(formError)) {
            if (formError.name && formError.name.length > 0) {
              setError("name", { message: formError.name[0] });
            }
            if (formError.email && formError.email.length > 0) {
              setError("email", { message: formError.email[0] });
            }
            if (formError.password && formError.password.length > 0) {
              setError("password", { message: formError.password[0] });
            }
            if (formError.password_confirmation && formError.password_confirmation.length > 0) {
              setError("password_confirmation", { message: formError.password_confirmation[0] });
            }
          } else {
            toast.error(error.response?.data.message || "Đăng ký thất bại", { autoClose: 2000 });
          }
        }
      },
    });
  });

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black relative">
      <Helmet>
        <title>Đăng ký tài khoản - FoodZone</title>
        <meta
          name="description"
          content="Đăng ký tài khoản FoodZone để bắt đầu đặt món ăn và tận hưởng trải nghiệm ẩm thực tuyệt vời."
        />
      </Helmet>

      <div className="absolute inset-0 bg-black bg-opacity-70 z-0">
        <div
          className="absolute inset-0 opacity-40 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://uploadthingy.s3.us-west-1.amazonaws.com/uyu2acjPcYECkW5skKw9Pc/preview-image.png')`,
            backgroundBlendMode: "overlay",
          }}
        />
      </div>

      <div className="absolute top-6 left-6 z-10 flex items-center">
        <div className="bg-orange-500 rounded-full p-2 mr-2">
          <LucideUtensils size={20} className="text-white" />
        </div>
        <span className="text-white font-bold text-xl">
          food<span className="text-orange-500">.</span>
        </span>
      </div>

      <div className="z-10 w-full max-w-md px-4">
        <div className="bg-[#1a1a1a] rounded-xl p-8 shadow-2xl w-full">
          <h1 className="text-2xl font-bold text-white text-center mb-8">Đăng ký</h1>
          <form onSubmit={handleSubmitForm}>
            <div className="mb-6">
              <label htmlFor="fullName" className="block text-gray-300 text-sm font-medium mb-2">
                Họ và tên
              </label>
              <input
                type="text"
                id="fullName"
                {...register("name")}
                className="w-full px-4 py-3 bg-[#2d2d2d] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                placeholder="Họ và tên của bạn"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>
            <div className="mb-6">
              <label htmlFor="email" className="block text-gray-300 text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                {...register("email")}
                className="w-full px-4 py-3 bg-[#2d2d2d] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                placeholder="your@email.com"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>
            <div className="mb-6 relative">
              <label htmlFor="password" className="block text-gray-300 text-sm font-medium mb-2">
                Mật khẩu
              </label>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                {...register("password")}
                className="w-full px-4 py-3 bg-[#2d2d2d] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-[70%] -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
            </div>
            <div className="mb-6 relative">
              <label htmlFor="confirmPassword" className="block text-gray-300 text-sm font-medium mb-2">
                Xác nhận mật khẩu
              </label>
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                {...register("password_confirmation")}
                className="w-full px-4 py-3 bg-[#2d2d2d] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-[44%] -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
              {errors.password_confirmation && (
                <p className="text-red-500 text-sm mt-1">{errors.password_confirmation.message}</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-lg transition duration-300"
            >
              Đăng ký
            </button>
          </form>

          <div className="mt-8">
            <div className="flex items-center mb-6">
              <div className="flex-grow h-px bg-gray-600"></div>
              <span className="px-4 text-sm text-gray-400">hoặc tiếp tục với</span>
              <div className="flex-grow h-px bg-gray-600"></div>
            </div>
            <div className="flex justify-center space-x-4">
              <button className="bg-white hover:bg-gray-100 text-black w-12 h-12 rounded-full flex items-center justify-center transition duration-300">
                <span className="font-bold">Google</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-white text-sm">
              Đã có tài khoản?{" "}
              <NavLink to="/login" className="text-orange-500 hover:text-orange-400">
                Đăng nhập
              </NavLink>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;