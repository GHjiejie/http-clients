<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import ChatArea from "./components/ChatArea.vue";
import KnowledgeBasePanel from "./components/KnowledgeBasePanel.vue";
import SessionList from "./components/SessionList.vue";
import SidebarBrand from "./components/SidebarBrand.vue";
import UserCard from "./components/UserCard.vue";
import type { KnowledgeBaseUpdateRequest } from "./api/services/doclibManage";
import { useKnowledgeBase } from "./composables/useKnowledgeBase";
import { useSessions } from "./composables/useSessions";
import GlobalLoadingOverlay from "./components/GlobalLoadingOverlay.vue";

const baseURL = (import.meta as any).env?.VITE_API_BASE_URL ?? "未配置";
const envToken = (import.meta as any).env?.VITE_API_TOKEN ?? "";
const defaultUserId = (import.meta as any).env?.VITE_DEFAULT_USER_ID ?? "demo-user";

const userId = ref(defaultUserId);
const sessionForm = reactive({
  title: "",
  systemPrompt: ""
});

const selectedChatKnowledgeBaseIds = ref<string[]>([]);

const {
  knowledgeBases,
  knowledgeBaseLoading,
  knowledgeBaseSaving,
  knowledgeBaseError,
  knowledgeBaseOptions,
  selectedKnowledgeBase,
  selectedKnowledgeBaseId,
  knowledgeBaseFiles,
  fileLoading,
  fileError,
  loadKnowledgeBases,
  createKnowledgeBase,
  updateKnowledgeBase,
  deleteKnowledgeBase,
  selectKnowledgeBase,
  addKnowledgeBaseFile,
  deleteKnowledgeBaseFile
} = useKnowledgeBase();

const {
  sessions,
  sessionLoading,
  sessionError,
  creatingSession,
  selectedSessionId,
  selectedSession,
  messages,
  messagesLoading,
  chatSending,
  chatError,
  loadSessions,
  createSession,
  deleteSession,
  renameSession,
  selectSession,
  sendMessage
} = useSessions();

const maskedToken = computed(() => {
  if (!envToken) return "未配置";
  return `${envToken.slice(0, 4)}...${envToken.slice(-4)}`;
});

const currentSessionTitle = computed(
  () => selectedSession.value?.conversation_title || selectedSession.value?.session_id || ""
);

onMounted(async () => {
  await Promise.all([loadKnowledgeBases(), loadSessions(userId.value)]);
});

const handleCreateSession = async () => {
  await createSession(userId.value, {
    title: sessionForm.title,
    systemPrompt: sessionForm.systemPrompt
  });
  sessionForm.title = "";
  sessionForm.systemPrompt = "";
};

const handleDeleteSession = async (id: string) => {
  if (!id) return;
  if (!window.confirm("确认删除该会话吗？")) return;
  await deleteSession(id);
};

const handleSelectSession = async (id: string) => {
  await selectSession(id);
};

const handleRenameSession = async (payload: { id: string; title: string }) => {
  await renameSession(payload.id, payload.title);
};

const handleSend = async (payload: { content: string; knowIds: string[] }) => {
  if (!selectedSessionId.value) {
    sessionError.value = "请先选择会话";
    return;
  }
  await sendMessage({
    sessionId: selectedSessionId.value,
    content: payload.content,
    knowIds: payload.knowIds
  });
};

const handleSelectKnowledgeBase = async (id: string) => {
  await selectKnowledgeBase(id);
  if (id && !selectedChatKnowledgeBaseIds.value.includes(id)) {
    selectedChatKnowledgeBaseIds.value = [...selectedChatKnowledgeBaseIds.value, id];
  }
};

const handleCreateKnowledgeBase = async (payload: { name: string; description?: string }) => {
  await createKnowledgeBase(payload.name, payload.description);
};

const handleUpdateKnowledgeBase = async (payload: { id: string; data: KnowledgeBaseUpdateRequest }) => {
  await updateKnowledgeBase(payload.id, payload.data);
};

const handleDeleteKnowledgeBase = async (id: string) => {
  if (!id) return;
  if (!window.confirm("确认删除该知识库吗？")) return;
  await deleteKnowledgeBase(id);
};

const handleAddFile = async (payload: { knowledgeBaseId: string; fileId: string }) => {
  await addKnowledgeBaseFile(payload.knowledgeBaseId, payload.fileId);
};

const handleDeleteFile = async (payload: { knowledgeBaseId: string; fileId: string }) => {
  await deleteKnowledgeBaseFile(payload.knowledgeBaseId, payload.fileId);
};

</script>

<template>
  <div class="app-shell">
    <GlobalLoadingOverlay />
    <aside class="sidebar">
      <SidebarBrand />
      <div class="sidebar__section">
        <SessionList
          :sessions="sessions"
          :selected-session-id="selectedSessionId"
          :loading="sessionLoading"
          @create="handleCreateSession"
          @refresh="() => loadSessions(userId.value)"
          @select="handleSelectSession"
          @delete="handleDeleteSession"
          @rename="handleRenameSession"
        />
      </div>
      <UserCard :user-id="userId" />
    </aside>

    <main class="main">
      <header class="main__header">
        <div>
          <div class="title">企业级对话与知识库控制台</div>
          <div class="meta">API 基础地址：{{ baseURL }}</div>
          <div class="meta">Token：{{ maskedToken }}</div>
        </div>
        <div class="actions">
          <input v-model="userId" placeholder="用户 ID" />
          <button class="ghost" :disabled="sessionLoading" @click="() => loadSessions(userId.value)">刷新会话</button>
          <button class="ghost" :disabled="knowledgeBaseLoading" @click="loadKnowledgeBases">刷新知识库</button>
        </div>
      </header>

      <section class="content">
        <div class="chat-column">
          <div class="session-form">
            <input v-model="sessionForm.title" placeholder="新建会话标题（可选）" />
            <textarea v-model="sessionForm.systemPrompt" placeholder="系统提示词（可选）"></textarea>
            <button :disabled="creatingSession" @click="handleCreateSession">创建会话</button>
            <div v-if="sessionError" class="error">{{ sessionError }}</div>
          </div>

          <ChatArea
            :messages="messages"
            :loading="messagesLoading"
            :error="chatError"
            :session-title="currentSessionTitle"
            :knowledge-base-options="knowledgeBaseOptions"
            :selected-knowledge-base-ids="selectedChatKnowledgeBaseIds"
            :sending="chatSending"
            :disabled="!selectedSessionId"
            @send="handleSend"
            @update:selected-knowledge-base-ids="(ids) => (selectedChatKnowledgeBaseIds.value = ids)"
          />
        </div>

        <div class="kb-column">
          <KnowledgeBasePanel
            :knowledge-bases="knowledgeBases"
            :selected-knowledge-base-id="selectedKnowledgeBaseId"
            :selected-knowledge-base="selectedKnowledgeBase"
            :files="knowledgeBaseFiles"
            :knowledge-base-loading="knowledgeBaseLoading"
            :knowledge-base-saving="knowledgeBaseSaving"
            :file-loading="fileLoading"
            :knowledge-base-error="knowledgeBaseError"
            :file-error="fileError"
            @refresh="loadKnowledgeBases"
            @create="handleCreateKnowledgeBase"
            @select="handleSelectKnowledgeBase"
            @update="handleUpdateKnowledgeBase"
            @delete="handleDeleteKnowledgeBase"
            @add-file="handleAddFile"
            @delete-file="handleDeleteFile"
          />
        </div>
      </section>
    </main>
  </div>
</template>
