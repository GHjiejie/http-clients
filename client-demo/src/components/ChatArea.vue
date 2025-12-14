<script setup lang="ts">
import MessageList from "./MessageList.vue";
import ChatInput from "./ChatInput.vue";
import type { ConversationMessage } from "../api/services/llmApps";

interface KnowledgeBaseOption {
  id: string;
  label: string;
}

const props = defineProps<{
  messages: ConversationMessage[];
  loading?: boolean;
  error?: string;
  sessionTitle?: string;
  knowledgeBaseOptions: KnowledgeBaseOption[];
  selectedKnowledgeBaseIds: string[];
  sending?: boolean;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: "send", payload: { content: string; knowIds: string[] }): void;
  (e: "update:selectedKnowledgeBaseIds", ids: string[]): void;
}>();
</script>

<template>
  <div class="chat-panel">
    <div class="chat-header">
      <div class="chat-title">{{ sessionTitle || "请选择对话" }}</div>
      <div class="chat-sub">基于知识库的模型对话</div>
    </div>
    <div class="chat-body">
      <MessageList :messages="messages" :loading="loading" />
    </div>
    <div v-if="error" class="error">{{ error }}</div>
    <ChatInput
      :knowledge-base-options="knowledgeBaseOptions"
      :selected-knowledge-base-ids="selectedKnowledgeBaseIds"
      :sending="sending"
      :disabled="disabled"
      @update:selected-knowledge-base-ids="(ids) => emit('update:selectedKnowledgeBaseIds', ids)"
      @send="emit('send', $event)"
    />
  </div>
</template>

<style scoped>
.chat-panel {
  display: grid;
  gap: 12px;
  height: 100%;
}

.chat-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.chat-title {
  font-size: 18px;
  font-weight: 800;
  color: #111827;
}

.chat-sub {
  color: #6b7280;
  font-size: 13px;
}

.chat-body {
  min-height: 420px;
}

.error {
  color: #dc2626;
  font-size: 13px;
}
</style>
