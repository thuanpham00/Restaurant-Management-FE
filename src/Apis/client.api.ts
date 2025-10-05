import Http from "src/Helpers/http";
import { AuthResponse, SuccessResponse, RegisterResponse, GoogleAuthResponse } from "src/Types/utils.type";


export const clientAPI = {
    auth: {
      loginClient: (body: { email: string; password: string }) => {
        return Http.post<SuccessResponse<AuthResponse>>("/api/auth/login", body);
      },
      logout: () => {
        return Http.post<SuccessResponse<AuthResponse>>("/api/auth/logout");
      },
      register: (body: { name: string; email: string; password: string; password_confirmation: string }) => {
        return Http.post<SuccessResponse<RegisterResponse>>("/api/auth/register", body);
      },
      getGoogleAuthUrl: () => {
        return Http.get<SuccessResponse<GoogleAuthResponse>>("/api/auth/google");
      },
      googleCallback: (code: string) => {
        return Http.get<SuccessResponse<AuthResponse>>(`/api/auth/google/callback?code=${code}`);
      },
    },
  };