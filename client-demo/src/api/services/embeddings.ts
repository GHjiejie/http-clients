import { httpClient } from "../client";
import type { components as EmbeddingsComponents } from "../generated/embeddings-service";
import { withBaseURL, type ServiceRequestOptions } from "./shared";

export type EmbeddingsRequest = EmbeddingsComponents["schemas"]["EmbeddingsRequest"];
export type EmbeddingsResponse = EmbeddingsComponents["schemas"]["EmbeddingsResponse"];

export type RerankRequest = EmbeddingsComponents["schemas"]["RerankRequest"];
export type RerankResponse = EmbeddingsComponents["schemas"]["RerankResponse"];

export const embeddingsApi = {
  createEmbedding(payload: EmbeddingsRequest, options?: ServiceRequestOptions) {
    return httpClient.request<EmbeddingsResponse, EmbeddingsRequest>({
      method: "POST",
      url: "/v1/embeddings",
      data: payload,
      ...withBaseURL(options)
    });
  },

  rerank(payload: RerankRequest, options?: ServiceRequestOptions) {
    return httpClient.request<RerankResponse, RerankRequest>({
      method: "POST",
      url: "/v1/rerank",
      data: payload,
      ...withBaseURL(options)
    });
  }
};
