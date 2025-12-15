import { computed, onBeforeUnmount, onMounted, ref } from "vue";

type LoadingEventDetail = {
  id: string;
  showLoading?: boolean;
  duration?: number;
};

const counter = ref(0);
const lastDuration = ref<number | undefined>(undefined);

const requestHandler = (event: Event) => {
  const detail = (event as CustomEvent<LoadingEventDetail>).detail;
  if (!detail || detail.showLoading !== true) return;
  counter.value += 1;
};

const completeHandler = (event: Event) => {
  const detail = (event as CustomEvent<LoadingEventDetail>).detail;
  if (!detail || detail.showLoading !== true) return;
  lastDuration.value = typeof detail.duration === "number" ? detail.duration : undefined;
  counter.value = Math.max(0, counter.value - 1);
};

const listeners = [
  ["httpClient:request", requestHandler],
  ["httpClient:complete", completeHandler]
] as const;

export const useGlobalLoading = () => {
  const isLoading = computed(() => counter.value > 0);
  const pending = computed(() => counter.value);

  onMounted(() => {
    if (typeof window === "undefined") return;
    listeners.forEach(([event, handler]) => {
      window.addEventListener(event, handler as EventListener);
    });
  });

  onBeforeUnmount(() => {
    if (typeof window === "undefined") return;
    listeners.forEach(([event, handler]) => {
      window.removeEventListener(event, handler as EventListener);
    });
  });

  return {
    isLoading,
    pending,
    lastDuration
  };
};
