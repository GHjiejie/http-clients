<script setup lang="ts">
import type { ConversationMessage } from "../api/services/llmApps";

defineProps<{
  messages: ConversationMessage[];
  loading?: boolean;
}>();
</script>

<template>
  <div class="message-area">
    <div v-if="loading" class="placeholder">消息加载中...</div>
    <div v-else-if="!messages.length" class="placeholder">暂无消息，先发一条吧。</div>
    <div v-else class="message-list">
      <div v-for="(message, index) in messages" :key="index" class="message">
        <div class="bubble user">
          <div class="meta">用户</div>
          <div class="content">{{ message.input }}</div>
        </div>
        <div class="bubble ai">
          <div class="meta">模型</div>
          <div class="content">{{ message.output }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.message-area {
  flex: 1;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 12px;
  overflow: auto;
}

.placeholder {
  color: #6b7280;
  text-align: center;
  padding: 24px 12px;
}

.message-list {
  display: grid;
  gap: 14px;
}

.message {
  display: grid;
  gap: 10px;
}

.bubble {
  border-radius: 12px;
  padding: 12px;
  border: 1px solid #e5e7eb;
}

.bubble.user {
  background: #fff;
}

.bubble.ai {
  background: #eef2ff;
  border-color: #c7d2fe;
}

.meta {
  font-weight: 700;
  margin-bottom: 6px;
  color: #111827;
}

.content {
  color: #111827;
  line-height: 1.6;
  white-space: pre-wrap;
}
</style>
