import { httpClient } from "../client";
import type { components as FineTuningComponents, paths as FineTuningPaths } from "../generated/fine-tuning-job-service";
import { withBaseURL, type ServiceRequestOptions } from "./shared";

export type JobListQuery = FineTuningPaths["/v1/fine_tuning/jobs"]["get"]["parameters"]["query"];
export type JobListResponse = FineTuningComponents["schemas"]["fine_tuning_job_serviceJobListResponse"];

export type JobCreateRequest =
  FineTuningPaths["/v1/fine_tuning/jobs"]["post"]["requestBody"]["content"]["application/json"];
export type FineTuningJob = FineTuningComponents["schemas"]["fine_tuning_job_serviceFineTuningJob"];

export type JobDeleteResponse = FineTuningComponents["schemas"]["fine_tuning_job_serviceJobDeleteResponse"];

export type JobEventListQuery =
  FineTuningPaths["/v1/fine_tuning/jobs/{fine_tuning_job_id}/events"]["get"]["parameters"]["query"];
export type JobEventListResponse = FineTuningComponents["schemas"]["fine_tuning_job_serviceJobEventListResponse"];

export const fineTuningJobApi = {
  listJobs(params?: JobListQuery, options?: ServiceRequestOptions) {
    return httpClient.request<JobListResponse>({
      method: "GET",
      url: "/v1/fine_tuning/jobs",
      params,
      ...withBaseURL(options)
    });
  },

  createJob(payload: JobCreateRequest, options?: ServiceRequestOptions) {
    return httpClient.request<FineTuningJob, JobCreateRequest>({
      method: "POST",
      url: "/v1/fine_tuning/jobs",
      data: payload,
      ...withBaseURL(options)
    });
  },

  getJob(jobId: string, options?: ServiceRequestOptions) {
    return httpClient.request<FineTuningJob>({
      method: "GET",
      url: `/v1/fine_tuning/jobs/${jobId}`,
      ...withBaseURL(options)
    });
  },

  deleteJob(jobId: string, options?: ServiceRequestOptions) {
    return httpClient.request<JobDeleteResponse>({
      method: "DELETE",
      url: `/v1/fine_tuning/jobs/${jobId}`,
      ...withBaseURL(options)
    });
  },

  cancelJob(jobId: string, options?: ServiceRequestOptions) {
    return httpClient.request<FineTuningJob>({
      method: "POST",
      url: `/v1/fine_tuning/jobs/${jobId}/cancel`,
      ...withBaseURL(options)
    });
  },

  listJobEvents(jobId: string, params?: JobEventListQuery, options?: ServiceRequestOptions) {
    return httpClient.request<JobEventListResponse>({
      method: "GET",
      url: `/v1/fine_tuning/jobs/${jobId}/events`,
      params,
      ...withBaseURL(options)
    });
  }
};
