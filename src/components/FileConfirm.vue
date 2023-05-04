<script setup>
import { ref } from 'vue'

const visible = ref(false)
const info = ref({})

const emit = defineEmits(['close'])
const handdleConfirm = (accept = false) => {
  visible.value = false
  console.log(accept)
  emit('close', accept)
}

// 计算文件大小
const fileSize = (k) => {
  const kb = k / 1024
  if (kb >= 1000) {
    const mb = kb / 1024
    if (mb >= 1000) {
      const gb = mb / 1024
      return gb.toFixed(2) + 'G'
    } else {
      return mb.toFixed(2) + 'M'
    }
  } else {
    return kb.toFixed(2) + 'K'
  }
}
defineExpose({
  show(data) {
    info.value = data
    visible.value = true
  }
})
</script>

<template>
  <div class="confirm-container" :class="{ 'show-confirm': visible }">
    <div class="confirm-title">文件确认</div>
    <div class="confirm-content">
      <p>{{ info.id }} 向你发送文件 <span class="file-name">{{ info.name }} ( {{ fileSize(info.size) }} )</span> </p>
      
    </div>
    <div class="confirm-bot">
      <button class="accept" @click="handdleConfirm(true)">接受</button>
      <button class="denied" @click="handdleConfirm(false)">拒绝</button>
    </div>
  </div>
</template>

<style lang="less" scoped>
.confirm-container {
  position: absolute;
  z-index: 3;
  width: 300px;
  padding: 0 12px;
  height: 120px;
  bottom: -120px;
  left: 0;
  display: flex;
  flex-direction: column;
  transition: all ease-in-out .3s;
  box-sizing: border-box;
  background: #fff;
  border-top: 1px solid #ccc;
  .confirm-title {
    flex: none;
    width: 100%;
    height: 26px;
    text-align: left;
    border-bottom: 1px solid #ccc;
  }
  .confirm-content {
    flex: auto;
    text-align: left;
    font-size: 14px;
    padding: 4px 0;
    .file-name {
      color: cornflowerblue;
    }
  }
  .confirm-bot {
    display: flex;
    flex: none;
    height: 30px;
    justify-content: space-between;
    align-items: center;
    & > button {
      border: 0;
      text-decoration: underline;
    }
  }
}
.show-confirm {
  bottom: 0;
}
</style>