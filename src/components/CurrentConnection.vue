<script setup>
import { ref } from 'vue'

const visible = ref(false)

const emit = defineEmits(['close'])
const handleClose = () => {
  emit('close')
  visible.value = false
}

defineExpose({
  show() {
    visible.value = true
  }
})
</script>

<template>
  <div class="channel-tips" :class="{ 'show-tips': visible }">
    <div class="channel-info">
      <img class="icon" src="https://placeholder.com/42x42.png" alt="">
      <img class="icon" src="https://placeholder.com/42x42.png" alt="">
      <span>channel calling...</span>
    </div>
    <button class="close-btn" @click="handleClose">close</button>      
  </div>
</template>

<style lang="less" scoped>

.channel-tips {
  position: absolute;
  box-sizing: border-box;
  border-top: 1px solid #ccc;
  width: 300px;
  padding: 0 12px;
  height: 60px;
  display: flex;
  justify-content: space-around;
  align-items: center;
  bottom: -60px;
  left: 0;
  gap: 20px;
}
.show-tips {
  bottom: 0;
}
.channel-info {
  display: flex;
  flex: auto;
  justify-content: space-around;
  align-items: center;
  font-size: 12px;
  & > img {
    width: 42px;
    height: 42px;
  }
}
.close-btn {
  flex: none;
  padding: 4px 6px;
  border-radius: 6px;
  color: #ff0000;
  border: 1px solid #ff0000;
  font-size: 14px;
}
</style>