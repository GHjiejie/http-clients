import { httpClient } from "../client";
import type { components as DataProcessComponents, paths as DataProcessPaths } from "../generated/data-process-service";
import { withBaseURL, type ServiceRequestOptions } from "./shared";

export type TaskListQuery = DataProcessPaths["/v1/tasks"]["get"]["parameters"]["query"];
export type TaskListResponse = DataProcessComponents["schemas"]["data_process_serviceTaskListResponse"];

export type TaskCreateRequest =
  DataProcessPaths["/v1/tasks"]["post"]["requestBody"]["content"]["application/json"];
export type TaskCreateResponse = DataProcessComponents["schemas"]["data_process_serviceTaskCreateResponse"];

export type BatchTaskGetQuery = DataProcessPaths["/v1/tasks/query"]["get"]["parameters"]["query"];
export type BatchTaskGetResponse = DataProcessComponents["schemas"]["data_process_serviceBatchTaskGetResponse"];

export type TaskDeleteResponse = DataProcessComponents["schemas"]["data_process_serviceTaskDeleteResponse"];

export const dataProcessApi = {
  listTasks(params?: TaskListQuery, options?: ServiceRequestOptions) {
    return httpClient.request<TaskListResponse>({
      method: "GET",
      url: "/v1/tasks",
      params,
      ...withBaseURL(options)
    });
  },

  createTask(payload: TaskCreateRequest, options?: ServiceRequestOptions) {
    return httpClient.request<TaskCreateResponse, TaskCreateRequest>({
      method: "POST",
      url: "/v1/tasks",
      data: payload,
      ...withBaseURL(options)
    });
  },

  batchGetTasks(params?: BatchTaskGetQuery, options?: ServiceRequestOptions) {
    return httpClient.request<BatchTaskGetResponse>({
      method: "GET",
      url: "/v1/tasks/query",
      params,
      ...withBaseURL(options)
    });
  },

  deleteTask(taskId: string, options?: ServiceRequestOptions) {
    return httpClient.request<TaskDeleteResponse>({
      method: "DELETE",
      url: `/v1/tasks/${taskId}`,
      ...withBaseURL(options)
    });
  }
};
