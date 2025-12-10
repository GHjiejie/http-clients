export interface ServiceRequestOptions {
  baseURL?: string;
}

export const withBaseURL = (options?: ServiceRequestOptions) => {
  return options?.baseURL ? { baseURL: options.baseURL } : {};
};
