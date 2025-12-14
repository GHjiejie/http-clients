import { computed, ref } from "vue";
import {
  llmAppsApi,
  type ChatConversationsRequest,
  type Conversation,
  type ConversationMessage
} from "../api/services/llmApps";
import { toMessage } from "../utils/error";

export interface CreateSessionPayload {
  title?: string;
  systemPrompt?: string;
}

export const useSessions = () => {
  const sessions = ref<Conversation[]>([]);
  const sessionLoading = ref(false);
  const sessionError = ref("");
  const creatingSession = ref(false);

  const selectedSessionId = ref<string | null>(null);
  const messages = ref<ConversationMessage[]>([]);
  const messagesLoading = ref(false);
  const chatSending = ref(false);
  const chatError = ref("");

  const selectedSession = computed(
    () => sessions.value.find((session) => session.session_id === selectedSessionId.value) ?? null
  );

  const loadSessions = async (userId: string) => {
    if (!userId.trim()) {
      sessionError.value = "请先填写用户ID";
      return;
    }
    sessionLoading.value = true;
    sessionError.value = "";
    try {
      const res = await llmAppsApi.listSessions(userId.trim());
      sessions.value = res.conversations ?? [];
      if (selectedSessionId.value && !sessions.value.find((item) => item.session_id === selectedSessionId.value)) {
        selectedSessionId.value = null;
        messages.value = [];
      }
    } catch (error) {
      sessionError.value = toMessage(error);
    } finally {
      sessionLoading.value = false;
    }
  };

  const createSession = async (userId: string, payload: CreateSessionPayload) => {
    if (!userId.trim()) {
      sessionError.value = "请先填写用户ID";
      return;
    }
    creatingSession.value = true;
    sessionError.value = "";
    try {
      const createPayload = {
        conversation_title: payload.title?.trim() || undefined,
        system_prompt: payload.systemPrompt?.trim()
          ? [{ role: "system" as const, content: payload.systemPrompt.trim() }]
          : undefined
      };
      const created = await llmAppsApi.createSession(createPayload);
      // 仅在创建成功且返回 session_id 时再刷新列表与消息，避免无效请求递归
      if (created.session_id) {
        await loadSessions(userId);
        selectedSessionId.value = created.session_id;
        await loadMessages(created.session_id);
      }
    } catch (error) {
      sessionError.value = toMessage(error);
    } finally {
      creatingSession.value = false;
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!sessionId) return;
    sessionLoading.value = true;
    sessionError.value = "";
    try {
      await llmAppsApi.deleteSession(sessionId);
      sessions.value = sessions.value.filter((session) => session.session_id !== sessionId);
      if (selectedSessionId.value === sessionId) {
        selectedSessionId.value = null;
        messages.value = [];
      }
    } catch (error) {
      sessionError.value = toMessage(error);
    } finally {
      sessionLoading.value = false;
    }
  };

  const renameSession = async (sessionId: string, title: string) => {
    if (!sessionId || !title.trim()) return;
    sessionLoading.value = true;
    sessionError.value = "";
    try {
      await llmAppsApi.updateSession(sessionId, { conversation_title: title.trim() });
      sessions.value = sessions.value.map((session) =>
        session.session_id === sessionId ? { ...session, conversation_title: title.trim() } : session
      );
    } catch (error) {
      sessionError.value = toMessage(error);
    } finally {
      sessionLoading.value = false;
    }
  };

  const selectSession = async (sessionId: string) => {
    if (!sessionId) return;
    selectedSessionId.value = sessionId;
    await loadMessages(sessionId);
  };

  const loadMessages = async (sessionId?: string) => {
    const id = sessionId ?? selectedSessionId.value;
    if (!id) return;
    messagesLoading.value = true;
    chatError.value = "";
    try {
      const res = await llmAppsApi.listMessages(id);
      messages.value = res.messages ?? [];
    } catch (error) {
      chatError.value = toMessage(error);
    } finally {
      messagesLoading.value = false;
    }
  };

  const sendMessage = async (payload: { sessionId: string; content: string; knowIds?: string[] }) => {
    if (!payload.sessionId) {
      chatError.value = "请先选择会话";
      return;
    }
    if (!payload.content.trim()) {
      chatError.value = "请输入内容";
      return;
    }
    chatSending.value = true;
    chatError.value = "";
    try {
      const request: ChatConversationsRequest = {
        session_id: payload.sessionId,
        content: payload.content.trim(),
        stream: false,
        know_ids: payload.knowIds && payload.knowIds.length ? payload.knowIds : undefined
      };
      await llmAppsApi.chatConversations(request);
      await loadMessages(payload.sessionId);
    } catch (error) {
      chatError.value = toMessage(error);
    } finally {
      chatSending.value = false;
    }
  };

  return {
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
    loadMessages,
    sendMessage
  };
};
