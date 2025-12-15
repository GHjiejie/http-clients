export interface ServiceRequestOptions {
  baseURL?: string;
  showGlobalLoading?: boolean;
}

export const withBaseURL = (options?: ServiceRequestOptions) => {
  const result: Record<string, unknown> = {};
  if (options?.baseURL) {
    result.baseURL = options.baseURL;
  }
  if (options?.showGlobalLoading !== undefined) {
    result.showGlobalLoading = options.showGlobalLoading;
  }
  return result;
};
