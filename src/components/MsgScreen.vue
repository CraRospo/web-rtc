<template>
  <div class="message">
    <div ref="screenRef" class="message-container">
      <div ref="wrapperRef" class="message-wrapper">
        <MsgComp
          v-for="(msg, index) in msgList"
          :msg="msg"
          :key="index"
        />
      </div>
    </div>
    <div class="operation">
      <ul class="operation-list">
        <li class="operation-list-item" @click="fileEle.click()">
          <img :src="fileIcon" title="file" alt="file">
        </li>
        <li class="operation-list-item" @click="shareScreen">
          <img :src="desktopIcon" title="desktop" alt="desktop">
        </li>
      </ul>
      <textarea class="text-input" id="story" name="story" rows="5" v-model="msg" @keyup.enter="send"></textarea>
      <button class="send-btn" @click="send">send</button>
    </div>
  </div>

  <input style="display: none" type="file" ref="fileEle" @change="onFileChange">
</template>

<script setup>
import { ref, unref, watch, nextTick } from 'vue'
import MsgComp from '/@/components/MsgComp.vue'
import { useStore } from '/@/store/global'
import { storeToRefs } from 'pinia'
import fileIcon from '/@/assets/file.svg'
import desktopIcon from '/@/assets/desktop.svg'

const store = useStore()
const { dataChannel, fileList, connection, shareStream } = storeToRefs(store)
const { createStream } = store
const { sendMsg } = store
const msgList = ref([])
const msg = ref('')

const fileEle = ref()
const wrapperRef = ref()
const screenRef = ref()

const onFileChange = (e) => {
  unref(fileList).splice(0, 0, ...e.target.files)

  sendFileConfirm()
}

    // 发送文件前 发送文件确认
const sendFileConfirm = () => {
  const { name, size, type } = unref(fileList)[0]

  sendMsg({
    type: 'file-sender',
    data: {
      id: '',
      name,
      size,
      type
    }
  })
}

watch(
  msgList,
  () => {
    nextTick(() => {
      screenRef.value.scrollTo({
        top: wrapperRef.value.offsetHeight,
        behavior: "smooth"
      })
    })
  }
)

const shareScreen = async () => {
  try {
    await createStream()
  } catch(err) {
    console.error("Error: " + err)
  }

  unref(dataChannel).send(JSON.stringify({
    type: 'action',
    data: 'share-req'
  }))
}

// 发送信道消息
const send = () => {
  const message = msg.value

  if (!message) return 
  // 发送消息
  unref(dataChannel).send(JSON.stringify({
    type: 'text',
    data: message
  }))

  // push当前消息
  msgList.value.push({
    type: 'text',
    data: {
      self: true,
      msg: message
    }
  })

  // 清除输入框
  msg.value = ''
}

defineExpose({
  msgList,
  acceptStream() {
    unref(shareStream).getTracks().forEach((track) => {
      unref(connection).addTrack(track, unref(shareStream))
    })
  }
})
</script>

<style lang="less" scoped>
.message {
  flex: auto;
  display: flex;
  flex-direction: column;
  .message-container {
    flex: auto;
    box-sizing: border-box;
    width: 100%;
    height: 584px;
    overflow: auto;
    &::-webkit-scrollbar-track-piece {
      background: #d3dce6;
    }

    &::-webkit-scrollbar {
      width: 0px;
      height: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background: #99a9bf;
      border-radius: 20px;
    }
  }
  .operation {
    border-top: 1px solid #ccc;
    box-sizing: border-box;
    flex: none;
    width: 100%;
    padding: 2px 4px;
    .text-input {
      box-sizing: border-box;
      width: 100%;
      padding: 2px 8px;
      border: 1px solid #ccc;
      outline: #aaa;
      &:focus {
        border-color: #aaa;
      }
      &:focus-visible {
        border-color: #aaa;
      }
    }
    .send-btn {
      display: block;
      margin-left: auto;
      color: #fff;
      background-color: green;
      border-radius: 4px;
      font-size: 12px;
    }
  }
}
.operation-list {
  padding: 4px 0;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  .operation-list-item {
    width: 24px;
    height: 24px;
    cursor: pointer;
    & + .operation-list-item {
      margin-left: 12px;
    }
    & > img {
      width: 100%;
      height: 100%;
    }
  }
}
</style>
