<template>
  <div class="brand">
    <div class="brand__logo">Hi</div>
    <div class="brand__name">HitenOS</div>
  </div>
</template>

<style scoped>
.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
}

.brand__logo {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #111827;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.brand__name {
  font-weight: 800;
  font-size: 18px;
  color: #111827;
}
</style>
