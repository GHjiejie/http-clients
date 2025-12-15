import { computed, ref } from "vue";
import {
  doclibManageApi,
  type KnowledgeBase,
  type KnowledgeBaseFile,
  type KnowledgeBaseUpdateRequest
} from "../api/services/doclibManage";
import { toMessage } from "../utils/error";

export const useKnowledgeBase = () => {
  const knowledgeBases = ref<KnowledgeBase[]>([]);
  const knowledgeBaseLoading = ref(false);
  const knowledgeBaseSaving = ref(false);
  const knowledgeBaseError = ref("");

  const selectedKnowledgeBaseId = ref<string | null>(null);
  const knowledgeBaseFiles = ref<KnowledgeBaseFile[]>([]);
  const fileLoading = ref(false);
  const fileError = ref("");

  const selectedKnowledgeBase = computed(
    () => knowledgeBases.value.find((kb) => kb.id === selectedKnowledgeBaseId.value) ?? null
  );

  const knowledgeBaseOptions = computed(() =>
    knowledgeBases.value
      .filter((kb) => !!kb.id)
      .map((kb) => ({
        id: kb.id as string,
        label: kb.name || kb.id || "未命名"
      }))
  );

  const loadKnowledgeBases = async () => {
    knowledgeBaseLoading.value = true;
    knowledgeBaseError.value = "";
    try {
      const res = await doclibManageApi.listKnowledgeBases(undefined, { showGlobalLoading: true });
      knowledgeBases.value = res.data ?? [];
      if (
        selectedKnowledgeBaseId.value &&
        !knowledgeBases.value.find((kb) => kb.id === selectedKnowledgeBaseId.value)
      ) {
        selectedKnowledgeBaseId.value = null;
        knowledgeBaseFiles.value = [];
      }
    } catch (error) {
      knowledgeBaseError.value = toMessage(error);
    } finally {
      knowledgeBaseLoading.value = false;
    }
  };

  const createKnowledgeBase = async (name: string, description?: string) => {
    if (!name.trim()) {
      knowledgeBaseError.value = "请填写知识库名称";
      return;
    }
    knowledgeBaseSaving.value = true;
    knowledgeBaseError.value = "";
    try {
      const payload = {
        name: name.trim(),
        description: description?.trim() || undefined
      };
      const kb = await doclibManageApi.createKnowledgeBase(payload, { showGlobalLoading: true });
      knowledgeBases.value = [kb, ...knowledgeBases.value];
    } catch (error) {
      knowledgeBaseError.value = toMessage(error);
    } finally {
      knowledgeBaseSaving.value = false;
    }
  };

  const updateKnowledgeBase = async (id: string, payload: KnowledgeBaseUpdateRequest) => {
    if (!id) return;
    knowledgeBaseSaving.value = true;
    knowledgeBaseError.value = "";
    try {
      const kb = await doclibManageApi.updateKnowledgeBase(id, payload, { showGlobalLoading: true });
      knowledgeBases.value = knowledgeBases.value.map((item) => (item.id === kb.id ? kb : item));
    } catch (error) {
      knowledgeBaseError.value = toMessage(error);
    } finally {
      knowledgeBaseSaving.value = false;
    }
  };

  const deleteKnowledgeBase = async (id: string) => {
    if (!id) return;
    knowledgeBaseSaving.value = true;
    knowledgeBaseError.value = "";
    try {
      await doclibManageApi.deleteKnowledgeBase(id, { showGlobalLoading: true });
      knowledgeBases.value = knowledgeBases.value.filter((kb) => kb.id !== id);
      if (selectedKnowledgeBaseId.value === id) {
        selectedKnowledgeBaseId.value = null;
        knowledgeBaseFiles.value = [];
      }
    } catch (error) {
      knowledgeBaseError.value = toMessage(error);
    } finally {
      knowledgeBaseSaving.value = false;
    }
  };

  const selectKnowledgeBase = async (id: string | null) => {
    selectedKnowledgeBaseId.value = id;
    if (id) {
      await loadKnowledgeBaseFiles(id);
    } else {
      knowledgeBaseFiles.value = [];
    }
  };

  const loadKnowledgeBaseFiles = async (knowledgeBaseId: string) => {
    fileLoading.value = true;
    fileError.value = "";
    try {
      const res = await doclibManageApi.listKnowledgeBaseFiles(knowledgeBaseId, undefined, { showGlobalLoading: true });
      knowledgeBaseFiles.value = res.data ?? [];
    } catch (error) {
      fileError.value = toMessage(error);
      knowledgeBaseFiles.value = [];
    } finally {
      fileLoading.value = false;
    }
  };

  const addKnowledgeBaseFile = async (knowledgeBaseId: string, fileId: string) => {
    if (!knowledgeBaseId || !fileId.trim()) {
      fileError.value = "请选择知识库并输入文件ID";
      return;
    }
    fileLoading.value = true;
    fileError.value = "";
    try {
      const payload = { file_id: fileId.trim() };
      const file = await doclibManageApi.addKnowledgeBaseFile(knowledgeBaseId, payload, { showGlobalLoading: true });
      const exists = knowledgeBaseFiles.value.find((item) => item.file_id === file.file_id);
      if (exists) {
        knowledgeBaseFiles.value = knowledgeBaseFiles.value.map((item) =>
          item.file_id === file.file_id ? file : item
        );
      } else {
        knowledgeBaseFiles.value = [file, ...knowledgeBaseFiles.value];
      }
    } catch (error) {
      fileError.value = toMessage(error);
    } finally {
      fileLoading.value = false;
    }
  };

  const deleteKnowledgeBaseFile = async (knowledgeBaseId: string, fileId: string) => {
    if (!knowledgeBaseId || !fileId) return;
    fileLoading.value = true;
    fileError.value = "";
    try {
      await doclibManageApi.deleteKnowledgeBaseFile(knowledgeBaseId, fileId, { showGlobalLoading: true });
      knowledgeBaseFiles.value = knowledgeBaseFiles.value.filter((file) => file.file_id !== fileId);
    } catch (error) {
      fileError.value = toMessage(error);
    } finally {
      fileLoading.value = false;
    }
  };

  return {
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
    loadKnowledgeBaseFiles,
    addKnowledgeBaseFile,
    deleteKnowledgeBaseFile
  };
};
