<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import {
  consoleApi,
  type CaptchaResponse,
  type LoginRequest,
  type LoginResponse,
  type LogoutResponse
} from "./api/services/console";
import {
  llmAppsApi,
  type ChatCompletionsRequest,
  type ChatCompletionsResponse,
  type ChatConversationsRequest,
  type ChatConversationsResponse,
  type ConversationsCreateResponse,
  type ConversationsMessagesResponse,
  type ConversationsResponse
} from "./api/services/llmApps";
import {
  doclibManageApi,
  type KnowledgeBase,
  type KnowledgeBaseFile,
  type KnowledgeBaseFileAddRequest,
  type KnowledgeBaseFileListResponse,
  type KnowledgeBaseListResponse,
  type KnowledgeBaseNewRequest
} from "./api/services/doclibManage";

type RequestState<T> = {
  loading: boolean;
  error: string;
  result: T | null;
};

const createRequestState = <T>() =>
  reactive<RequestState<T>>({
    loading: false,
    error: "",
    result: null
  });

const handleRequest = async <T>(state: RequestState<T>, action: () => Promise<T>) => {
  state.loading = true;
  state.error = "";
  state.result = null;
  try {
    state.result = await action();
  } catch (error) {
    state.error = error instanceof Error ? error.message : "未知错误";
  } finally {
    state.loading = false;
  }
};

const formatJson = (data: unknown) => JSON.stringify(data, null, 2);
const parseIds = (value: string) => {
  const ids = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return ids.length ? ids : undefined;
};

const baseURL = ref((import.meta as any).env?.VITE_API_BASE_URL ?? "http://localhost:8080");
const token = ref(localStorage.getItem("token") ?? "");

watch(token, (value) => {
  if (value) {
    localStorage.setItem("token", value);
  } else {
    localStorage.removeItem("token");
  }
});

// console 服务
const loginForm = reactive<LoginRequest>({
  username: "",
  password: "",
  captcha_id: "",
  captcha_value: ""
});
const loginState = createRequestState<LoginResponse>();
const doLogin = () =>
  handleRequest(loginState, () => consoleApi.login(loginForm, { baseURL: baseURL.value }));

const captchaState = createRequestState<CaptchaResponse>();
const fetchCaptcha = () =>
  handleRequest(captchaState, () => consoleApi.generateCaptcha({ baseURL: baseURL.value }));

const logoutState = createRequestState<LogoutResponse>();
const doLogout = () =>
  handleRequest(logoutState, () => consoleApi.logout({}, { baseURL: baseURL.value }));

// llm-apps 服务
const completionsForm = reactive<ChatCompletionsRequest>({
  model: "",
  stream: false,
  messages: [{ role: "user", content: "你好，可以介绍一下这个 Demo 吗？" }]
});
const completionsPrompt = ref("你好，可以介绍一下这个 Demo 吗？");
const completionsKnowIds = ref("");
const completionsState = createRequestState<ChatCompletionsResponse>();
const runCompletions = () =>
  handleRequest(completionsState, () =>
    llmAppsApi.chatCompletions(
      {
        ...completionsForm,
        messages: [{ role: "user", content: completionsPrompt.value }],
        know_ids: parseIds(completionsKnowIds.value)
      },
      { baseURL: baseURL.value }
    )
  );

const sessionId = ref("");
const conversationForm = reactive<ChatConversationsRequest>({
  content: "帮我总结一下知识库接口的作用",
  stream: false,
  model: ""
});
const conversationKnowIds = ref("");
const conversationState = createRequestState<ChatConversationsResponse>();
const createSessionState = createRequestState<ConversationsCreateResponse>();
const messagesState = createRequestState<ConversationsMessagesResponse>();
const sessionsUserId = ref("demo-user");
const sessionsState = createRequestState<ConversationsResponse>();

const createSession = () =>
  handleRequest(createSessionState, async () => {
    const data = await llmAppsApi.createSession(
      { conversation_title: "Demo 会话" },
      { baseURL: baseURL.value }
    );
    if (data.session_id) {
      sessionId.value = data.session_id;
    }
    return data;
  });

const sendConversation = () =>
  handleRequest(conversationState, () =>
    llmAppsApi.chatConversations(
      {
        ...conversationForm,
        session_id: sessionId.value || conversationForm.session_id,
        know_ids: parseIds(conversationKnowIds.value)
      },
      { baseURL: baseURL.value }
    )
  );

const fetchMessages = () =>
  handleRequest(messagesState, () => {
    if (!sessionId.value) {
      throw new Error("请先填写或创建 session_id");
    }
    return llmAppsApi.listMessages(sessionId.value, { baseURL: baseURL.value });
  });

const fetchSessions = () =>
  handleRequest(sessionsState, () => {
    if (!sessionsUserId.value) {
      throw new Error("请填写 user_id");
    }
    return llmAppsApi.listSessions(sessionsUserId.value, { baseURL: baseURL.value });
  });

// doclib-manage 服务
const kbForm = reactive<KnowledgeBaseNewRequest>({
  name: "demo-knowledge-base",
  description: "演示创建的知识库"
});
const knowledgeBaseId = ref("");
const kbCreateState = createRequestState<KnowledgeBase>();
const kbListState = createRequestState<KnowledgeBaseListResponse>();
const kbDetailState = createRequestState<KnowledgeBase>();
const kbFilesState = createRequestState<KnowledgeBaseFileListResponse>();
const kbFileForm = reactive<KnowledgeBaseFileAddRequest>({
  file_id: ""
});
const kbFileState = createRequestState<KnowledgeBaseFile>();

const createKnowledgeBase = () =>
  handleRequest(kbCreateState, async () => {
    const data = await doclibManageApi.createKnowledgeBase(kbForm, { baseURL: baseURL.value });
    if (data.id) {
      knowledgeBaseId.value = data.id;
    }
    return data;
  });

const listKnowledgeBases = () =>
  handleRequest(kbListState, async () => {
    const data = await doclibManageApi.listKnowledgeBases({ limit: 10 }, { baseURL: baseURL.value });
    if (!knowledgeBaseId.value && data.data?.length) {
      knowledgeBaseId.value = data.data[0]?.id ?? "";
    }
    return data;
  });

const getKnowledgeBase = () =>
  handleRequest(kbDetailState, () => {
    if (!knowledgeBaseId.value) {
      throw new Error("请先填写知识库ID");
    }
    return doclibManageApi.getKnowledgeBase(knowledgeBaseId.value, { baseURL: baseURL.value });
  });

const listKnowledgeBaseFiles = () =>
  handleRequest(kbFilesState, () => {
    if (!knowledgeBaseId.value) {
      throw new Error("请先填写知识库ID");
    }
    return doclibManageApi.listKnowledgeBaseFiles(
      knowledgeBaseId.value,
      { limit: 10 },
      { baseURL: baseURL.value }
    );
  });

const addKnowledgeBaseFile = () =>
  handleRequest(kbFileState, () => {
    if (!knowledgeBaseId.value) {
      throw new Error("请先填写知识库ID");
    }
    if (!kbFileForm.file_id) {
      throw new Error("请先填写文件ID");
    }
    return doclibManageApi.addKnowledgeBaseFile(
      knowledgeBaseId.value,
      kbFileForm,
      { baseURL: baseURL.value }
    );
  });
</script>

<template>
  <main class="page">
    <div class="container">
      <section class="hero">
        <div>
          <p class="eyebrow">Protocol API Demo</p>
          <h1>多服务接口全景演示</h1>
          <p class="hint">
            覆盖 console / llm-apps / doclib-manage，基于自动生成的类型 + 统一 HttpClient。
          </p>
        </div>
        <div class="hero__controls">
          <label>
            <span>API Base URL</span>
            <input v-model="baseURL" placeholder="http://localhost:8080" />
          </label>
          <label>
            <span>Bearer Token（写入 localStorage）</span>
            <input v-model="token" placeholder="可选，token 将自动放入 Authorization 头" />
          </label>
        </div>
      </section>

      <section class="panels">
        <article class="panel panel--wide">
          <header class="panel__header">
            <div>
              <p class="eyebrow">console</p>
              <h2>登录 / 验证码 / 注销</h2>
              <p class="sub">鉴权类接口示例，演示请求封装与错误处理。</p>
            </div>
            <div class="panel__actions">
              <button type="button" :disabled="captchaState.loading" @click="fetchCaptcha">
                {{ captchaState.loading ? "获取中..." : "刷新验证码" }}
              </button>
              <button type="button" :disabled="logoutState.loading" @click="doLogout">
                {{ logoutState.loading ? "注销中..." : "注销" }}
              </button>
            </div>
          </header>

          <div class="api-block">
            <h3>POST /v1/auth/login</h3>
            <div class="form-grid">
              <label>
                <span>用户名</span>
                <input v-model="loginForm.username" placeholder="username" />
              </label>
              <label>
                <span>密码</span>
                <input v-model="loginForm.password" type="password" placeholder="password" />
              </label>
              <label>
                <span>验证码 ID</span>
                <input v-model="loginForm.captcha_id" placeholder="captcha_id" />
              </label>
              <label>
                <span>验证码值</span>
                <input v-model="loginForm.captcha_value" placeholder="captcha_value" />
              </label>
            </div>
            <div class="action-row">
              <button type="button" :disabled="loginState.loading" @click="doLogin">
                {{ loginState.loading ? "请求中..." : "登录" }}
              </button>
              <span class="status error" v-if="loginState.error">错误：{{ loginState.error }}</span>
            </div>
            <div class="api-result" v-if="loginState.result">
              <pre>{{ formatJson(loginState.result) }}</pre>
            </div>
          </div>

          <div class="api-inline">
            <div class="api-result">
              <h4>GET /v1/captchas</h4>
              <p v-if="captchaState.loading">请求中...</p>
              <p class="error" v-if="captchaState.error">错误：{{ captchaState.error }}</p>
              <pre v-if="captchaState.result">{{ formatJson(captchaState.result) }}</pre>
            </div>
            <div class="api-result">
              <h4>POST /v1/auth/logout</h4>
              <p v-if="logoutState.loading">请求中...</p>
              <p class="error" v-if="logoutState.error">错误：{{ logoutState.error }}</p>
              <pre v-if="logoutState.result">{{ formatJson(logoutState.result) }}</pre>
            </div>
          </div>
        </article>

        <article class="panel">
          <header class="panel__header">
            <div>
              <p class="eyebrow">llm-apps</p>
              <h2>对话生成（无状态）</h2>
              <p class="sub">POST /v1/llm/chat-completions</p>
            </div>
            <div class="panel__actions">
              <span class="badge">支持选择知识库 ID</span>
            </div>
          </header>

          <div class="api-block">
            <div class="form-grid">
              <label>
                <span>模型（可选）</span>
                <input v-model="completionsForm.model" placeholder="例如 Antelope-L1-65B-3-01" />
              </label>
              <label>
                <span>关联知识库ID（逗号分隔，可选）</span>
                <input v-model="completionsKnowIds" placeholder="kb1,kb2" />
              </label>
              <label class="span-2">
                <span>用户提问</span>
                <textarea
                  v-model="completionsPrompt"
                  rows="3"
                  placeholder="你好，可以介绍一下这个 Demo 吗？"
                />
              </label>
            </div>
            <div class="action-row">
              <button type="button" :disabled="completionsState.loading" @click="runCompletions">
                {{ completionsState.loading ? "生成中..." : "生成" }}
              </button>
              <span class="status error" v-if="completionsState.error">错误：{{ completionsState.error }}</span>
            </div>
            <div class="api-result" v-if="completionsState.result">
              <pre>{{ formatJson(completionsState.result) }}</pre>
            </div>
          </div>
        </article>

        <article class="panel">
          <header class="panel__header">
            <div>
              <p class="eyebrow">llm-apps</p>
              <h2>对话生成（有会话）</h2>
              <p class="sub">创建会话 -> 发消息 -> 查看会话/消息列表。</p>
            </div>
            <div class="panel__actions">
              <button type="button" :disabled="createSessionState.loading" @click="createSession">
                {{ createSessionState.loading ? "创建中..." : "创建会话" }}
              </button>
            </div>
          </header>

          <div class="api-block">
            <div class="form-grid">
              <label>
                <span>当前 session_id</span>
                <input v-model="sessionId" placeholder="自动回填或手动填写" />
              </label>
              <label>
                <span>模型（可选）</span>
                <input v-model="conversationForm.model" placeholder="例如 Antelope-L1-65B-3-01" />
              </label>
              <label>
                <span>知识库ID（逗号分隔，可选）</span>
                <input v-model="conversationKnowIds" placeholder="kb1,kb2" />
              </label>
              <label class="span-2">
                <span>用户消息</span>
                <textarea
                  v-model="conversationForm.content"
                  rows="3"
                  placeholder="帮我总结一下知识库接口的作用"
                />
              </label>
            </div>
            <div class="action-row">
              <button type="button" :disabled="conversationState.loading" @click="sendConversation">
                {{ conversationState.loading ? "发送中..." : "发送消息" }}
              </button>
              <button type="button" :disabled="messagesState.loading" @click="fetchMessages">
                {{ messagesState.loading ? "拉取中..." : "查看消息列表" }}
              </button>
              <span class="status error" v-if="conversationState.error">错误：{{ conversationState.error }}</span>
              <span class="status error" v-if="messagesState.error">错误：{{ messagesState.error }}</span>
            </div>
            <div class="api-inline">
              <div class="api-result" v-if="conversationState.result">
                <h4>对话回复</h4>
                <pre>{{ formatJson(conversationState.result) }}</pre>
              </div>
              <div class="api-result" v-if="messagesState.result">
                <h4>消息列表</h4>
                <pre>{{ formatJson(messagesState.result) }}</pre>
              </div>
            </div>
            <div class="api-result" v-if="createSessionState.result">
              <h4>创建会话响应</h4>
              <pre>{{ formatJson(createSessionState.result) }}</pre>
            </div>
          </div>

          <div class="api-block">
            <h3>GET /v1/llm/chat/{user_id}/sessions</h3>
            <div class="form-grid">
              <label>
                <span>user_id</span>
                <input v-model="sessionsUserId" placeholder="demo-user" />
              </label>
            </div>
            <div class="action-row">
              <button type="button" :disabled="sessionsState.loading" @click="fetchSessions">
                {{ sessionsState.loading ? "查询中..." : "查询会话列表" }}
              </button>
              <span class="status error" v-if="sessionsState.error">错误：{{ sessionsState.error }}</span>
            </div>
            <div class="api-result" v-if="sessionsState.result">
              <pre>{{ formatJson(sessionsState.result) }}</pre>
            </div>
          </div>
        </article>

        <article class="panel panel--wide">
          <header class="panel__header">
            <div>
              <p class="eyebrow">doclib-manage</p>
              <h2>知识库管理</h2>
              <p class="sub">创建 / 查询 / 列表 / 文件操作。</p>
            </div>
          </header>

          <div class="api-block">
            <h3>POST /v1/knowledge-bases</h3>
            <div class="form-grid">
              <label>
                <span>名称</span>
                <input v-model="kbForm.name" placeholder="demo-knowledge-base" />
              </label>
              <label>
                <span>描述</span>
                <input v-model="kbForm.description" placeholder="演示创建的知识库" />
              </label>
            </div>
            <div class="action-row">
              <button type="button" :disabled="kbCreateState.loading" @click="createKnowledgeBase">
                {{ kbCreateState.loading ? "创建中..." : "创建知识库" }}
              </button>
              <button type="button" :disabled="kbListState.loading" @click="listKnowledgeBases">
                {{ kbListState.loading ? "查询中..." : "获取列表" }}
              </button>
              <span class="status error" v-if="kbCreateState.error">错误：{{ kbCreateState.error }}</span>
              <span class="status error" v-if="kbListState.error">错误：{{ kbListState.error }}</span>
            </div>
            <div class="api-inline">
              <div class="api-result" v-if="kbCreateState.result">
                <h4>创建结果</h4>
                <pre>{{ formatJson(kbCreateState.result) }}</pre>
              </div>
              <div class="api-result" v-if="kbListState.result">
                <h4>列表结果</h4>
                <pre>{{ formatJson(kbListState.result) }}</pre>
              </div>
            </div>
          </div>

          <div class="api-block">
            <h3>GET /v1/knowledge-bases/{knowledge_base_id}</h3>
            <div class="form-grid">
              <label class="span-2">
                <span>knowledge_base_id</span>
                <input v-model="knowledgeBaseId" placeholder="创建后自动填充，也可手填" />
              </label>
            </div>
            <div class="action-row">
              <button type="button" :disabled="kbDetailState.loading" @click="getKnowledgeBase">
                {{ kbDetailState.loading ? "查询中..." : "查询详情" }}
              </button>
              <span class="status error" v-if="kbDetailState.error">错误：{{ kbDetailState.error }}</span>
            </div>
            <div class="api-result" v-if="kbDetailState.result">
              <pre>{{ formatJson(kbDetailState.result) }}</pre>
            </div>
          </div>

          <div class="api-block">
            <div class="api-inline">
              <div class="api-result">
                <h4>GET /v1/knowledge-bases/{id}/files</h4>
                <button type="button" :disabled="kbFilesState.loading" @click="listKnowledgeBaseFiles">
                  {{ kbFilesState.loading ? "查询中..." : "列出文件" }}
                </button>
                <p class="error" v-if="kbFilesState.error">错误：{{ kbFilesState.error }}</p>
                <pre v-if="kbFilesState.result">{{ formatJson(kbFilesState.result) }}</pre>
              </div>
              <div class="api-result">
                <h4>POST /v1/knowledge-bases/{id}/files</h4>
                <label>
                  <span>file_id</span>
                  <input v-model="kbFileForm.file_id" placeholder="上传后的文件ID" />
                </label>
                <button type="button" :disabled="kbFileState.loading" @click="addKnowledgeBaseFile">
                  {{ kbFileState.loading ? "添加中..." : "添加文件" }}
                </button>
                <p class="error" v-if="kbFileState.error">错误：{{ kbFileState.error }}</p>
                <pre v-if="kbFileState.result">{{ formatJson(kbFileState.result) }}</pre>
              </div>
            </div>
          </div>
        </article>
      </section>
    </div>
  </main>
</template>
