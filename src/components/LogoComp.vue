<template>
  <div class="logo-container">
    <img
      class="logo-icon"
      :src="LogoUrl"
      alt="logo"
    >
    <h4 class="logo-title">
      our chat
    </h4>
  </div>
</template>

<script setup>
import LogoUrl from '/@/assets/logo.png'

</script>

<style lang="less" scoped>
.logo-container {
  display: flex;
  justify-content: center;
  align-items: center;
  .logo-icon {
    width: 32px;
    height: 32px;
  }
  .logo-title {
    margin-left: 18px;
    font-size: 18px;
  }
}
</style>