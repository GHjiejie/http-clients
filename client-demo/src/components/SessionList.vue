<script setup lang="ts">
import type { Conversation } from "../api/services/llmApps";

const props = defineProps<{
  sessions: Conversation[];
  selectedSessionId: string | null;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: "create"): void;
  (e: "refresh"): void;
  (e: "select", id: string): void;
  (e: "delete", id: string): void;
  (e: "rename", payload: { id: string; title: string }): void;
}>();

const promptRename = (session: Conversation) => {
  const next = window.prompt("请输入新的会话标题", session.conversation_title || session.session_id || "");
  if (next === null || next === undefined || !session.session_id) return;
  emit("rename", { id: session.session_id, title: next });
};
</script>

<template>
  <div class="session-list">
    <div class="session-list__controls">
      <button class="primary" @click="emit('create')">＋ 新建对话</button>
      <button class="ghost" :disabled="loading" @click="emit('refresh')">刷新</button>
    </div>
    <div class="session-list__body">
      <div v-if="loading" class="placeholder">正在加载...</div>
      <div v-else-if="!sessions.length" class="placeholder">暂无会话，点击上方创建</div>
      <ul v-else>
        <li
          v-for="session in sessions"
          :key="session.session_id"
          :class="['session-list__item', { active: session.session_id === selectedSessionId }]"
          @click="session.session_id && emit('select', session.session_id)"
        >
          <div class="title">{{ session.conversation_title || session.session_id }}</div>
          <div class="actions" @click.stop>
            <button class="link" @click="promptRename(session)">重命名</button>
            <button class="link danger" @click="session.session_id && emit('delete', session.session_id)">删除</button>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.session-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.session-list__controls {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
}

button.primary {
  background: #111827;
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 10px 12px;
  font-weight: 700;
  cursor: pointer;
}

button.ghost {
  background: #fff;
  color: #111827;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px 12px;
  cursor: pointer;
}

.session-list__body {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 6px;
  min-height: 300px;
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.session-list__item {
  padding: 12px 10px;
  border-radius: 10px;
  cursor: pointer;
  border: 1px solid transparent;
}

.session-list__item:hover {
  background: #f8fafc;
}

.session-list__item.active {
  background: #eef2ff;
  border-color: #c7d2fe;
}

.title {
  font-weight: 600;
  color: #111827;
}

.actions {
  margin-top: 6px;
  display: flex;
  gap: 8px;
}

button.link {
  border: none;
  background: transparent;
  color: #2563eb;
  cursor: pointer;
  padding: 0;
  font-size: 13px;
}

button.link.danger {
  color: #dc2626;
}

.placeholder {
  padding: 12px;
  color: #6b7280;
  font-size: 14px;
}
</style>
