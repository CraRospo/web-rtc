<template>
  <Teleport to="#main">
    <div
      v-if="visible"
      class="message-container"
    >
      {{ message }}
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue';

const visible = ref(false)
const message = ref('')

watch(
  visible,
  (val) => {
    if (val) {
      setTimeout(() => {
        visible.value = false
      }, 3500)
    }
  }
)

defineExpose({
  show(msg) {
    visible.value = true
    message.value = msg
  }
})
</script>

<style scoped>
.message-container {
  padding: 2px 8px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: #ccc;
  color: #fff;
  z-index: 99;
}
</style>