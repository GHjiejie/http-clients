<script setup lang="ts">
import { reactive, ref } from "vue";
import type { KnowledgeBase, KnowledgeBaseFile, KnowledgeBaseUpdateRequest } from "../api/services/doclibManage";

const props = defineProps<{
  knowledgeBases: KnowledgeBase[];
  selectedKnowledgeBaseId: string | null;
  selectedKnowledgeBase: KnowledgeBase | null;
  files: KnowledgeBaseFile[];
  knowledgeBaseLoading?: boolean;
  knowledgeBaseSaving?: boolean;
  fileLoading?: boolean;
  knowledgeBaseError?: string;
  fileError?: string;
}>();

const emit = defineEmits<{
  (e: "refresh"): void;
  (e: "create", payload: { name: string; description?: string }): void;
  (e: "select", id: string): void;
  (e: "update", payload: { id: string; data: KnowledgeBaseUpdateRequest }): void;
  (e: "delete", id: string): void;
  (e: "add-file", payload: { knowledgeBaseId: string; fileId: string }): void;
  (e: "delete-file", payload: { knowledgeBaseId: string; fileId: string }): void;
}>();

const createForm = reactive({
  name: "",
  description: ""
});

const editForm = reactive({
  name: "",
  description: ""
});

const fileForm = ref("");

const startEdit = (kb: KnowledgeBase) => {
  editForm.name = kb.name || "";
  editForm.description = kb.description || "";
};

const saveEdit = (id?: string) => {
  if (!id) return;
  const data: KnowledgeBaseUpdateRequest = {
    name: editForm.name.trim() || undefined,
    description: editForm.description.trim() || undefined
  };
  emit("update", { id, data });
};

const resetFileForm = () => {
  fileForm.value = "";
};
</script>

<template>
  <div class="kb-panel">
    <div class="panel-header">
      <div>
        <div class="title">知识库管理</div>
        <div class="subtitle">增删改查 + 文件管理</div>
      </div>
      <button class="ghost" :disabled="knowledgeBaseLoading" @click="emit('refresh')">刷新</button>
    </div>

    <div class="card">
      <div class="section-title">新建知识库</div>
      <div class="form-row">
        <input v-model="createForm.name" placeholder="名称" />
        <input v-model="createForm.description" placeholder="描述（可选）" />
        <button
          :disabled="knowledgeBaseSaving"
          @click="emit('create', { name: createForm.name, description: createForm.description })"
        >
          创建
        </button>
      </div>
      <div v-if="knowledgeBaseError" class="error">{{ knowledgeBaseError }}</div>
    </div>

    <div class="card list-card">
      <div class="section-title">知识库列表</div>
      <div v-if="knowledgeBaseLoading" class="placeholder">加载中...</div>
      <div v-else-if="!knowledgeBases.length" class="placeholder">暂无知识库</div>
      <div v-else class="kb-list">
        <div
          v-for="kb in knowledgeBases"
          :key="kb.id"
          :class="['kb-item', { active: kb.id === selectedKnowledgeBaseId }]"
          @click="kb.id && emit('select', kb.id)"
        >
          <div class="kb-head">
            <div class="kb-name">{{ kb.name || "未命名" }}</div>
            <div class="kb-id">{{ kb.id }}</div>
          </div>
          <div class="kb-desc">{{ kb.description || "暂无描述" }}</div>
          <div class="kb-actions" @click.stop>
            <button class="link" @click="kb.id && emit('delete', kb.id)">删除</button>
            <button class="link" @click="startEdit(kb)">编辑</button>
            <button v-if="kb.id" class="link" @click="emit('select', kb.id)">选择</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedKnowledgeBaseId" class="card">
      <div class="section-title">编辑知识库</div>
      <div class="form-row">
        <input v-model="editForm.name" placeholder="名称" />
        <input v-model="editForm.description" placeholder="描述" />
        <button :disabled="knowledgeBaseSaving" @click="saveEdit(selectedKnowledgeBaseId)">保存</button>
      </div>
    </div>

    <div class="card">
      <div class="section-title">
        文件管理
        <span class="tag" v-if="selectedKnowledgeBase">当前：{{ selectedKnowledgeBase.name || selectedKnowledgeBase.id }}</span>
      </div>
      <div v-if="!selectedKnowledgeBaseId" class="placeholder">请选择知识库以查看文件</div>
      <div v-else class="stack">
        <div class="form-row">
          <input v-model="fileForm" placeholder="文件 ID" />
          <button
            :disabled="fileLoading"
            @click="emit('add-file', { knowledgeBaseId: selectedKnowledgeBaseId, fileId: fileForm }); resetFileForm()"
          >
            添加
          </button>
        </div>
        <div v-if="fileError" class="error">{{ fileError }}</div>
        <div v-if="fileLoading" class="placeholder">加载文件中...</div>
        <div v-else-if="!files.length" class="placeholder">暂无文件</div>
        <ul v-else class="file-list">
          <li v-for="file in files" :key="file.file_id" class="file-item">
            <div class="file-meta">
              <div class="file-name">{{ file.filename || file.file_id }}</div>
              <div class="file-status">{{ file.status || "unknown" }}</div>
            </div>
            <div class="file-actions">
              <span class="file-id">{{ file.file_id }}</span>
              <button
                class="link danger"
                @click="emit('delete-file', { knowledgeBaseId: selectedKnowledgeBaseId, fileId: file.file_id || '' })"
              >
                删除
              </button>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.kb-panel {
  display: grid;
  gap: 12px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-weight: 800;
  font-size: 18px;
  color: #111827;
}

.subtitle {
  color: #6b7280;
  font-size: 13px;
}

.card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px;
  display: grid;
  gap: 10px;
}

.list-card {
  max-height: 320px;
  overflow: auto;
}

.section-title {
  font-weight: 700;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 8px;
}

input {
  padding: 10px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #f8fafc;
}

button {
  border-radius: 10px;
  border: none;
  background: #2563eb;
  color: #fff;
  padding: 10px 12px;
  cursor: pointer;
}

button.ghost {
  background: #fff;
  border: 1px solid #e5e7eb;
  color: #111827;
}

.error {
  color: #dc2626;
  font-size: 13px;
}

.placeholder {
  color: #6b7280;
  font-size: 14px;
}

.kb-list {
  display: grid;
  gap: 8px;
}

.kb-item {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px;
  cursor: pointer;
}

.kb-item.active {
  background: #eef2ff;
  border-color: #c7d2fe;
}

.kb-head {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.kb-name {
  font-weight: 700;
  color: #111827;
}

.kb-id {
  color: #6b7280;
  font-size: 12px;
}

.kb-desc {
  color: #4b5563;
  margin-top: 6px;
}

.kb-actions {
  margin-top: 8px;
  display: flex;
  gap: 10px;
}

button.link {
  background: transparent;
  border: none;
  padding: 0;
  color: #2563eb;
}

button.link.danger {
  color: #dc2626;
}

.stack {
  display: grid;
  gap: 8px;
}

.file-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 8px;
}

.file-item {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px;
}

.file-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.file-name {
  font-weight: 700;
  color: #111827;
}

.file-status {
  color: #2563eb;
  font-size: 13px;
}

.file-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px;
}

.file-id {
  color: #6b7280;
  font-size: 13px;
}

.tag {
  font-size: 12px;
  background: #f1f5f9;
  padding: 4px 8px;
  border-radius: 999px;
  color: #111827;
}
</style>
