import { httpClient } from "../client";
import type { components as RetrieveComponents } from "../generated/doclib-retrieve-worker";
import { withBaseURL, type ServiceRequestOptions } from "./shared";

export type SearchRequest = RetrieveComponents["schemas"]["doclib_retrieve_workerSearchRequest"];
export type SearchResponse = RetrieveComponents["schemas"]["doclib_retrieve_workerSearchResponse"];

export const doclibRetrieveWorkerApi = {
  search(payload: SearchRequest, options?: ServiceRequestOptions) {
    return httpClient.request<SearchResponse, SearchRequest>({
      method: "POST",
      url: "/v1/search",
      data: payload,
      ...withBaseURL(options)
    });
  }
};
