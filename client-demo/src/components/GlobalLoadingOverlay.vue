<script setup lang="ts">
import { computed } from "vue";
import { useGlobalLoading } from "../composables/useGlobalLoading";

const props = defineProps<{
  text?: string;
}>();

const { isLoading, pending, lastDuration } = useGlobalLoading();

const label = computed(() => {
  if (props.text) return props.text;
  const duration = lastDuration.value ? `${lastDuration.value}ms` : "";
  return pending.value > 1
    ? `处理中 (${pending.value} 个请求)… ${duration}`
    : `处理中… ${duration}`;
});
</script>

<template>
  <transition name="fade">
    <div v-if="isLoading" class="global-loading">
      <div class="spinner" />
      <div class="text">{{ label }}</div>
    </div>
  </transition>
</template>

<style scoped>
.global-loading {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(17, 24, 39, 0.35);
  backdrop-filter: blur(2px);
  z-index: 9999;
  pointer-events: all;
}

.spinner {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 4px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  animation: spin 0.9s linear infinite;
  margin-right: 12px;
}

.text {
  color: #fff;
  font-weight: 600;
  letter-spacing: 0.2px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
