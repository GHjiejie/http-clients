import { HttpError } from "../api/httpClient";

export const toMessage = (error: unknown): string => {
  if (error instanceof HttpError) {
    const dataMessage =
      typeof error.data === "object" && error.data && "message" in (error.data as Record<string, unknown>)
        ? String((error.data as Record<string, unknown>).message)
        : undefined;
    return dataMessage || error.message;
  }
  if (error instanceof Error) return error.message;
  return "未知错误";
};
