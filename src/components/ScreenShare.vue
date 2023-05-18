<template>
  <div v-if="visible" class="container">
    <video class="video" ref="videoRef" autoplay></video>
    <div class="operation">
      <CustomButton @click="onAbort">结束共享</CustomButton>
      <CustomButton @click="onRecord">{{ recordStatus ? '结束' : '录制' }}</CustomButton>
    </div>
  </div>
</template>

<script setup>
import { ref, unref } from 'vue'
import { storeToRefs } from 'pinia'
import { useStore } from '/@/store/global.js'

const store = useStore()
const { target } = storeToRefs(store)
const { sendMsg } = store

const visible = ref(false)
const videoRef = ref()
const recordStatus = ref(false)
const recorder = ref()
const recorderChunk = ref([])

// 停止接收流
const onAbort = () => {
  let tracks = unref(videoRef).srcObject.getTracks()
  tracks.forEach((track) => track.stop())
  unref(videoRef).srcObject = null

  sendMsg({
    type: 'stream-abort',
    target: unref(target)
  })

  visible.value = false
}

// 录制
const onRecord = () => {
  if (unref(recordStatus)) {
    try {
      unref(recorder).stop()
      recordStatus.value = false
    } catch (error) {
      console.log(error)
    }
  } else {
    const source = unref(videoRef).srcObject
    recorder.value = new MediaRecorder(source)
    unref(recorder).ondataavailable = handleDataAvailable
    unref(recorder).start()
    recordStatus.value = true
  }
}

// stream chunk
const handleDataAvailable = (event) => {

  if (event.data.size > 0) {
    recorderChunk.value.push(event.data)
    download()
  } else {
    console.log('no stream flow!')
  }
}

const download = () => {
  var blob = new Blob(unref(recorderChunk), { type: unref(recorderChunk)[0].type })

  var url = URL.createObjectURL(blob)
  var a = document.createElement("a")
  document.body.appendChild(a)
  a.style = "display: none"
  a.href = url
  a.download = "record"
  a.click()
  window.URL.revokeObjectURL(url)
}

defineExpose({
  show() {
    visible.value = true
  },

  hide() {
    visible.value = false
  },

  setSource(source) {
    unref(videoRef).srcObject = source
  },

  clearSource() {
    unref(videoRef).srcObject = null
    visible.value = false
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
    justify-content: start;
    gap: 20px;
    align-items: center;
  }
}
</style>