<script setup>
import { ref, watch, nextTick } from 'vue'
import MsgComp from './components/MsgComp.vue'
import GroupList from './components/GroupList.vue'
import ConnectionTips from './components/ConnectionTips.vue'
import CurrentConnection from './components/CurrentConnection.vue'

  let wsInstance = null
  let connection = null
  let dataChannel = null

  const msg = ref('')
  const msgList = ref([])
  const groupListRef = ref()
  const wrapperRef = ref()
  const screenRef = ref()

  watch(
    msgList,
    () => {
      console.log(12313)
      nextTick(() => {
        let height = wrapperRef.value.offsetHeight
        screenRef.value.scrollTo({
          top: height,
          behavior: "smooth"
        })
      })
    }
  )

  // ws信道服务转发处理
  const handleWsMsg = async (e) => {
    const { type, data } = JSON.parse(e.data)

    switch (type) {
      case 'offer':
        await createAnswer(data)
        break;
      case 'answer':
        await receiveAnswer(data)
        break;
      case 'system':
        msgList.value.push({ type, data })
        groupListRef.value.getGroupList()
        break;
      case 'media':
        console.log(`its a media channel req!`)
        break;
      case 'connect':
        renderChannelReq(data)
        break;
      case 'accept':
        create()
        console.log('connection create!')
        break;
      case 'denied':
        console.log('connection denied!')
        console.log(connection)
        console.log(dataChannel)
        break;
      default:
        break;
    }
  }

  // 请求弹窗
  const connectionTipsRef = ref()
  const renderChannelReq = (data) => {
    connectionTipsRef.value.show(data.reqName)
  }

  // 发送web-rtc连接请求
  const sendConnectionReq = (target) => {
    wsInstance.send(JSON.stringify({
      type: 'connect',
      data: target
    }))
  }

  // 拒绝连接请求
  const handleChannelDenied = () => {
    wsInstance.send(JSON.stringify({
      type: 'denied'
    }))
  }

  // 同意链接请求
  const handleChannelAccept = () => {
    wsInstance.send(JSON.stringify({
      type: 'accept'
    }))

    // 接收方初始化连接
    receive()
  }

  const CurrentConnectionRef = ref()
  // 信道打开回调
  const handleChannelOpen = () => {
    console.log('channel open')
    CurrentConnectionRef.value.show()
  }

  // 信道关闭回调
  const handleChannelClose = () => {
    console.log('channel close')
  }

  // 主动关闭信道
  const onChannelClose = () => {
    console.log('close channel by user')
    dataChannel.close()
  }

  // 信道消息接受回调
  const handleChannelMessage = (e) => {
    console.log('Message receive!')
    console.log(e.data)

    msgList.value.push({
      type: 'text',
      data: {
        self: false,
        name: '密友',
        msg: e.data
      }
    })
  }

  // 发起信道创建
  const create = () => {
    connection = new RTCPeerConnection()

    dataChannel = connection.createDataChannel('arthur')
    console.log('创建信道')

    dataChannel.onmessage = handleChannelMessage
    dataChannel.onopen = handleChannelOpen
    dataChannel.onclose = handleChannelClose

    createOffer()
  }

  // 接收方信道创建
  const receive = () => {
    connection = new RTCPeerConnection()

    connection.ondatachannel = (e) => {
      console.log('reciver channel create!')
      console.log(dataChannel)
      dataChannel = e.channel
      dataChannel.onmessage = handleChannelMessage
      dataChannel.onopen = handleChannelOpen
      dataChannel.onclose = handleChannelClose
    }
  }

  // 发送信道消息
  const send = () => {
    const message = msg.value

    if (!message) return 
    // 发送消息
    dataChannel.send(message)

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

  // 链接ws
  const handleWsOpen = () => {

  }

  // 发起ws验证
  const connect = async () => {
    const res = await fetch('/api/login',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userName: `用户${new Date().valueOf()}`,
          password: '123456'
        })
      }
    )
    const response = await res.json()

    if (response.code === 0) {
      console.log(response)
      wsInstance = new WebSocket('ws://127.0.0.1:8010')
      wsInstance.onmessage = handleWsMsg
      wsInstance.onopen = handleWsOpen
    }
  }

  const createOffer = async() => {
    const offer = await connection.createOffer()
    console.log('A 创建offer')
    await connection.setLocalDescription(offer)
    console.log('A 将自创建的offer设置为本地描述')

    // ICE候选人的本地描述发生改变触发
    // https://developer.mozilla.org/zh-CN/docs/Web/API/RTCPeerConnection/icecandidate_event
    connection.onicecandidate = async (event) => {
      if (event.candidate) {
        const offerSdp = connection.localDescription
        console.log('A 在设置完自己的本地描述后 将其发送给服务端')

        // 发送 offer
        if (offerSdp) {
          wsInstance.send(JSON.stringify({
            type: 'offer',
            data: offerSdp
          }))
        }
      }
    }
  }

  const createAnswer = async (offer) => {
      connection.onicecandidate = async (event) => {
      console.log('emit')
      console.log(event)

      // 当一个新的 answer ICE candidate 被创建时
      if (event.candidate) {
        console.log('B 在设置完自己的本地描述后 将其发送给服务端')
        wsInstance.send(JSON.stringify({
          type: 'answer',
          data: connection.localDescription
        }))
      }
    }

    try {
      await connection.setRemoteDescription(offer)
      console.log('B 将从服务端获取到的A的本地描述 设置成B自己的远端描述')
      const answer = await connection.createAnswer()
      console.log('B 创建一个应答')
      await connection.setLocalDescription(answer)
      console.log('B 将自创建的应答设置为B自己的本地描述')
    } catch (error) {
      console.log(error)
    }
  }

  const receiveAnswer = async(answer) => {
    console.log('A 从服务端获取B的本地描述后 将其设置为A自己的远程描述')
    // 添加 answer(应答)
    if (!connection.currentRemoteDescription) {
      await connection.setRemoteDescription(answer)
    }
  }
</script>

<template>
  <div class="main-container">
    
    <GroupList
      ref="groupListRef"
      @connect="(target) => sendConnectionReq(target)"
    />
    <ConnectionTips
      ref="connectionTipsRef"
      @accept="handleChannelAccept"
      @denied="handleChannelDenied"
    />
    <CurrentConnection
      ref="CurrentConnectionRef"
      @close="onChannelClose"
    />
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
        <textarea class="text-input" id="story" name="story" rows="5" v-model="msg" @keyup.enter="send"></textarea>
        <button class="send-btn" @click="send">send</button>
      </div>
    </div>

  </div>

  <button @click="connect">connection</button>
  <button @click="sendConnectionReq">sendConnectionReq</button>
</template>

<style scoped lang="less">
.main-container {
  width: 972px;
  height: 695px;
  border: 1px solid #ccc;
  display: flex;
  overflow: hidden;
  position: relative;

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
} 
</style>
