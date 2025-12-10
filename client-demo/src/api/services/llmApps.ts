import { httpClient } from "../client";
import type { paths as LlmPaths } from "../generated/llm-apps_chatbot";
import { withBaseURL, type ServiceRequestOptions } from "./shared";

export type ChatCompletionsRequest =
  LlmPaths["/v1/llm/chat-completions"]["post"]["requestBody"]["content"]["application/json"];
export type ChatCompletionsResponse =
  LlmPaths["/v1/llm/chat-completions"]["post"]["responses"]["200"]["content"]["application/json"];

export type ChatConversationsRequest =
  LlmPaths["/v1/llm/chat-conversations"]["post"]["requestBody"]["content"]["application/json"];
export type ChatConversationsResponse =
  LlmPaths["/v1/llm/chat-conversations"]["post"]["responses"]["200"]["content"]["application/json"];

export type ConversationsCreateRequest =
  LlmPaths["/v1/llm/chat/sessions"]["post"]["requestBody"]["content"]["application/json"];
export type ConversationsCreateResponse =
  LlmPaths["/v1/llm/chat/sessions"]["post"]["responses"]["200"]["content"]["application/json"];

export type ConversationsUpdateRequest =
  LlmPaths["/v1/llm/chat/sessions/{session_id}"]["put"]["requestBody"]["content"]["application/json"];
export type ConversationsUpdateResponse =
  LlmPaths["/v1/llm/chat/sessions/{session_id}"]["put"]["responses"]["200"]["content"]["application/json"];

export type ConversationsDeleteResponse =
  LlmPaths["/v1/llm/chat/sessions/{session_id}"]["delete"]["responses"]["200"]["content"]["application/json"];

export type ConversationsMessagesResponse =
  LlmPaths["/v1/llm/chat/sessions/{session_id}/messages"]["get"]["responses"]["200"]["content"]["application/json"];

export type ConversationsResponse =
  LlmPaths["/v1/llm/chat/{user_id}/sessions"]["get"]["responses"]["200"]["content"]["application/json"];

export const llmAppsApi = {
  chatCompletions(payload: ChatCompletionsRequest, options?: ServiceRequestOptions) {
    return httpClient.request<ChatCompletionsResponse, ChatCompletionsRequest>({
      method: "POST",
      url: "/v1/llm/chat-completions",
      data: payload,
      ...withBaseURL(options)
    });
  },

  chatConversations(payload: ChatConversationsRequest, options?: ServiceRequestOptions) {
    return httpClient.request<ChatConversationsResponse, ChatConversationsRequest>({
      method: "POST",
      url: "/v1/llm/chat-conversations",
      data: payload,
      ...withBaseURL(options)
    });
  },

  createSession(payload: ConversationsCreateRequest, options?: ServiceRequestOptions) {
    return httpClient.request<ConversationsCreateResponse, ConversationsCreateRequest>({
      method: "POST",
      url: "/v1/llm/chat/sessions",
      data: payload,
      ...withBaseURL(options)
    });
  },

  updateSession(sessionId: string, payload: ConversationsUpdateRequest, options?: ServiceRequestOptions) {
    return httpClient.request<ConversationsUpdateResponse, ConversationsUpdateRequest>({
      method: "PUT",
      url: `/v1/llm/chat/sessions/${sessionId}`,
      data: payload,
      ...withBaseURL(options)
    });
  },

  deleteSession(sessionId: string, options?: ServiceRequestOptions) {
    return httpClient.request<ConversationsDeleteResponse>({
      method: "DELETE",
      url: `/v1/llm/chat/sessions/${sessionId}`,
      ...withBaseURL(options)
    });
  },

  listMessages(sessionId: string, options?: ServiceRequestOptions) {
    return httpClient.request<ConversationsMessagesResponse>({
      method: "GET",
      url: `/v1/llm/chat/sessions/${sessionId}/messages`,
      ...withBaseURL(options)
    });
  },

  listSessions(userId: string, options?: ServiceRequestOptions) {
    return httpClient.request<ConversationsResponse>({
      method: "GET",
      url: `/v1/llm/chat/${userId}/sessions`,
      ...withBaseURL(options)
    });
  }
};
