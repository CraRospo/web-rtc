<template>
  <div v-if="visible" class="container">
    <video class="video" ref="videoRef" autoplay></video>
    <div class="operation">
      <CustomButton @click="onAbort">abort</CustomButton>
      <CustomButton @click="onRecord">{{ recordStatus ? 'record' : 'stop' }}</CustomButton>
      <CustomButton @click="onPrintScreen">print screen</CustomButton>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const visible = ref(false)
const videoRef = ref()
const recordStatus = ref(false)

const onAbort = () => {

}

const onRecord = () => {

}

const onPrintScreen = () => {
  
}

defineExpose({
  show() {
    visible.value = true
  },

  setSource(source) {
    console.log(source)
    videoRef.value.srcObject = source
  }
})

</script>

<style lang="less" scoped>
@width: 640px;
.container {
  position: absolute;
  top: 0;
  right: 15px;
  background: #fff;
  z-index: 98;
  .video {
    width: @width;
    height: @width * (9 / 16);
  }
  .operation {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style>