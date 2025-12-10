import { httpClient } from "../client";
import type { paths as ConsolePaths } from "../generated/console";
import { withBaseURL, type ServiceRequestOptions } from "./shared";

export type LoginRequest = ConsolePaths["/v1/auth/login"]["post"]["requestBody"]["content"]["application/json"];
export type LoginResponse = ConsolePaths["/v1/auth/login"]["post"]["responses"]["200"]["content"]["application/json"];

export type LogoutRequest = ConsolePaths["/v1/auth/logout"]["post"]["requestBody"]["content"]["application/json"];
export type LogoutResponse = ConsolePaths["/v1/auth/logout"]["post"]["responses"]["200"]["content"]["application/json"];

export type CaptchaResponse = ConsolePaths["/v1/captchas"]["get"]["responses"]["200"]["content"]["application/json"];

export const consoleApi = {
  login(payload: LoginRequest, options?: ServiceRequestOptions) {
    return httpClient.request<LoginResponse, LoginRequest>({
      method: "POST",
      url: "/v1/auth/login",
      data: payload,
      ...withBaseURL(options)
    });
  },

  logout(payload: LogoutRequest | undefined, options?: ServiceRequestOptions) {
    return httpClient.request<LogoutResponse, LogoutRequest | undefined>({
      method: "POST",
      url: "/v1/auth/logout",
      data: payload,
      ...withBaseURL(options)
    });
  },

  generateCaptcha(options?: ServiceRequestOptions) {
    return httpClient.request<CaptchaResponse>({
      method: "GET",
      url: "/v1/captchas",
      ...withBaseURL(options)
    });
  }
};
