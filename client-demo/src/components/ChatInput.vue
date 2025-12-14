<script setup lang="ts">
import { ref, watch } from "vue";

interface KnowledgeBaseOption {
  id: string;
  label: string;
}

const props = defineProps<{
  knowledgeBaseOptions: KnowledgeBaseOption[];
  selectedKnowledgeBaseIds: string[];
  sending?: boolean;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: "send", payload: { content: string; knowIds: string[] }): void;
  (e: "update:selectedKnowledgeBaseIds", ids: string[]): void;
}>();

const draft = ref("");
const selectedIds = ref<string[]>(props.selectedKnowledgeBaseIds);

watch(
  () => props.selectedKnowledgeBaseIds,
  (next) => {
    selectedIds.value = [...next];
  }
);

const toggleKnowledgeBase = (id: string) => {
  if (selectedIds.value.includes(id)) {
    selectedIds.value = selectedIds.value.filter((item) => item !== id);
  } else {
    selectedIds.value = [...selectedIds.value, id];
  }
  emit("update:selectedKnowledgeBaseIds", selectedIds.value);
};

const onSend = () => {
  emit("send", { content: draft.value, knowIds: selectedIds.value });
  draft.value = "";
};
</script>

<template>
  <div class="chat-input">
    <div class="kb-select" v-if="knowledgeBaseOptions.length">
      <div class="label">知识库</div>
      <div class="chips">
        <button
          v-for="kb in knowledgeBaseOptions"
          :key="kb.id"
          type="button"
          :class="['chip', { active: selectedIds.includes(kb.id) }]"
          @click="toggleKnowledgeBase(kb.id)"
        >
          {{ kb.label }}
        </button>
      </div>
    </div>
    <div class="input-row">
      <textarea
        v-model="draft"
        :disabled="disabled || sending"
        placeholder="你想知道什么？"
        @keydown.enter.exact.prevent="onSend"
      ></textarea>
      <button class="send" :disabled="disabled || sending" @click="onSend">发送</button>
    </div>
  </div>
</template>

<style scoped>
.chat-input {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #fff;
  padding: 12px;
  display: grid;
  gap: 10px;
}

.kb-select {
  display: grid;
  gap: 6px;
}

.label {
  color: #6b7280;
  font-size: 13px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #f8fafc;
  cursor: pointer;
  color: #111827;
}

.chip.active {
  background: #eef2ff;
  border-color: #c7d2fe;
  color: #1d4ed8;
}

.input-row {
  display: grid;
  grid-template-columns: 1fr 100px;
  gap: 10px;
  align-items: center;
}

textarea {
  width: 100%;
  min-height: 100px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 12px;
  font-size: 14px;
  resize: vertical;
}

.send {
  height: 100%;
  border-radius: 12px;
  border: none;
  background: linear-gradient(120deg, #2563eb, #1d4ed8);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}

.send:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
