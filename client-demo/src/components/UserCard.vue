<script setup lang="ts">
const props = defineProps<{
  userId: string;
}>();
</script>

<template>
  <div class="user-card">
    <div class="avatar">{{ props.userId?.[0]?.toUpperCase() || "U" }}</div>
    <div class="info">
      <div class="name">{{ props.userId || "未登录" }}</div>
      <div class="role">业务管理员</div>
    </div>
    <button class="home">首页</button>
  </div>
</template>

<style scoped>
.user-card {
  margin-top: auto;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(120deg, #2563eb, #1d4ed8);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.info {
  flex: 1;
}

.name {
  font-weight: 700;
  color: #111827;
}

.role {
  color: #6b7280;
  font-size: 13px;
}

.home {
  border: none;
  background: #f8fafc;
  border-radius: 10px;
  padding: 8px 10px;
  color: #111827;
  cursor: pointer;
}
</style>
