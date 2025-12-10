import { httpClient } from "../client";
import type { components as DoclibComponents, paths as DoclibPaths } from "../generated/doclib-manager-service";
import { withBaseURL, type ServiceRequestOptions } from "./shared";

export type KnowledgeBase = DoclibComponents["schemas"]["doclib_manager_serviceKnowledgeBase"];
export type KnowledgeBaseListResponse = DoclibComponents["schemas"]["doclib_manager_serviceKnowledgeBaseListResponse"];
export type KnowledgeBaseListQuery = DoclibPaths["/v1/knowledge-bases"]["get"]["parameters"]["query"];
export type KnowledgeBaseNewRequest =
  DoclibPaths["/v1/knowledge-bases"]["post"]["requestBody"]["content"]["application/json"];

export type KnowledgeBaseFile = DoclibComponents["schemas"]["doclib_manager_serviceKnowledgeBaseFile"];
export type KnowledgeBaseFileListResponse =
  DoclibComponents["schemas"]["doclib_manager_serviceKnowledgeBaseFileListResponse"];
export type KnowledgeBaseFileListQuery =
  DoclibPaths["/v1/knowledge-bases/{knowledge_base_id}/files"]["get"]["parameters"]["query"];
export type KnowledgeBaseFileAddRequest =
  DoclibPaths["/v1/knowledge-bases/{knowledge_base_id}/files"]["post"]["requestBody"]["content"]["application/json"];

export const doclibManageApi = {
  listKnowledgeBases(params?: KnowledgeBaseListQuery, options?: ServiceRequestOptions) {
    return httpClient.request<KnowledgeBaseListResponse>({
      method: "GET",
      url: "/v1/knowledge-bases",
      params,
      ...withBaseURL(options)
    });
  },

  createKnowledgeBase(payload: KnowledgeBaseNewRequest, options?: ServiceRequestOptions) {
    return httpClient.request<KnowledgeBase, KnowledgeBaseNewRequest>({
      method: "POST",
      url: "/v1/knowledge-bases",
      data: payload,
      ...withBaseURL(options)
    });
  },

  getKnowledgeBase(knowledgeBaseId: string, options?: ServiceRequestOptions) {
    return httpClient.request<KnowledgeBase>({
      method: "GET",
      url: `/v1/knowledge-bases/${knowledgeBaseId}`,
      ...withBaseURL(options)
    });
  },

  listKnowledgeBaseFiles(knowledgeBaseId: string, params?: KnowledgeBaseFileListQuery, options?: ServiceRequestOptions) {
    return httpClient.request<KnowledgeBaseFileListResponse>({
      method: "GET",
      url: `/v1/knowledge-bases/${knowledgeBaseId}/files`,
      params,
      ...withBaseURL(options)
    });
  },

  addKnowledgeBaseFile(knowledgeBaseId: string, payload: KnowledgeBaseFileAddRequest, options?: ServiceRequestOptions) {
    return httpClient.request<KnowledgeBaseFile, KnowledgeBaseFileAddRequest>({
      method: "POST",
      url: `/v1/knowledge-bases/${knowledgeBaseId}/files`,
      data: payload,
      ...withBaseURL(options)
    });
  }
};
