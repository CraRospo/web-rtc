<script setup>
import { ref, watch } from 'vue'

const visible = ref(false)
const progressing = ref(false)
const isSender = ref(false)
const info = ref({})

const emit = defineEmits(['close', 'cancel'])
const handdleConfirm = (accept = false) => {
  accept ? progressing.value = true : visible.value = false
  emit('close', accept)
}

const handleCancel = (isSender) => {
  console.log('issender' + isSender)
  emit('cancel', isSender)
}

watch(
  () => props.percent,
  (val) => {
    if (val === 100) {
      visible.value = false
    }
  }
)

const props = defineProps({
  percent: Number
})

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
  show(data, renderType) {
    info.value = data
    isSender.value = renderType === 1 ? true : false 
    visible.value = true
  },
  hide() {
    visible.value = false
    progressing.value = false
    isSender.value = false
    info.value = {}
  }
})
</script>

<template>
  <div class="confirm-container" :class="{ 'show-confirm': visible }">
    <div class="confirm-title">文件确认</div>
    <div class="confirm-content">
      <p v-if="!isSender">接收文件 <span class="file-name">{{ info.name }} ( {{ fileSize(info.size) }} )</span> </p>
      <p v-else>发送文件<span class="file-name">{{ info.name }} ( {{ fileSize(info.size) }} )</span></p>
      <div v-if="progressing || isSender">
        <progress :value="props.percent" max="100"></progress>{{ `${props.percent} %` }}
      </div>
    </div>
    <div class="confirm-bot">
      <button v-if="!progressing && !isSender" class="accept" @click="handdleConfirm(true)">接受</button>
      <button v-if="!progressing && !isSender" class="denied" @click="handdleConfirm(false)">拒绝</button>
      <button v-if="progressing || isSender" class="cancel" @click="handleCancel(isSender)">取消</button>
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
    .cancel {
      margin-left: auto;
    }
  }
}
.show-confirm {
  bottom: 0;
}
</style>