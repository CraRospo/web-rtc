<template>
  <div v-if="visible" class="modal-container">
    <h6 class="modal-title">{{ t }}</h6>
    <div class="modal-content">{{ d }}</div>
    <div class="modal-footer">
      <button class="confirm" @click="handleConfirm">Confirm</button>
      <button class="cancel" @click="handleCancel">Cancel</button>
    </div>
  </div>
</template>

<script setup>
import { ref, unref } from 'vue'
import { storeToRefs } from 'pinia'
import { useStore } from '/@/store/global.js'

const store = useStore()
const { dataChannel } = storeToRefs(store)
const visible = ref(false)
const t = ref('')
const d = ref('')

const emit = defineEmits(['confirm'])
const handleConfirm = () => {
  unref(dataChannel).send(JSON.stringify({
    type: 'action',
    data: 'share-accept'
  }))

  visible.value = false
  emit('confirm')
}

const reset = () => {
  t.value = ''
  d.value = ''

  visible.value = false
}

const handleCancel = () => {
  reset()
}

defineExpose({
  show({ title = '系统提示', description = '' }) {
    t.value = title
    d.value = description
    visible.value = true
  }
})
</script>

<style lang="less" scoped>
.modal-container {
  position: absolute;
  width: 240px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border: 1px solid #ccc;
  border-radius: 6px;
  .modal-title {
    box-sizing: border-box;
    height: 28px;
    width: 100%;
    border-bottom: 1px solid #ccc;
    margin: 0;
    padding: 8px 12px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .modal-content {
    text-align: center;
    padding: 8px 12px;
    min-height: 56px;
    line-height: 28px;
  }
  .modal-footer {
    border-top: 1px solid #ccc;
    display: flex;
    height: 32px;
    width: 100%;
    & > button {
      box-sizing: border-box;
      flex: 1;
      & + button{
        border-left: 1px solid #ccc;
      }
    }
  }
}
</style>