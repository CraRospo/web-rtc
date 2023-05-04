<script setup>
import { ref, unref } from 'vue'
import GroupList from './components/GroupList.vue'
import ConnectionTips from './components/ConnectionTips.vue'
import CurrentConnection from './components/CurrentConnection.vue'
import FileConfirm from './components/FileConfirm.vue'
import MsgScreen from './components/MsgScreen.vue'
import { storeToRefs } from 'pinia'
import { useStore } from '/@/store/global.js'

  // store
  const store = useStore()
  const { wsInstance, connection, dataChannel, sctp, fileList } = storeToRefs(store)
  const { createWsInstance, createConnection, createChannel, getConnectionSCTP, sendMsg } = store
  console.log(store)

  const groupListRef = ref()
  const msgScreenRef = ref()
  const fileReceiverRef = ref()

  const wsConnectBtnStatus = ref(false)

  const fileReceiver = ref({})
  let receiver = {
    chunk: [],
    offset: 0
  
  }

  // 关闭弹窗
  window.addEventListener('beforeunload', () => {
    if (unref(wsInstance) && unref(wsInstance).readyState === 1) {
      unref(wsInstance).close(1000)
    }
  })

  // receiver文件确认
  const handleConfirmClose = (accept) => {
    sendMsg({
      type: 'file-receiver',
      data: accept
    })
  }

  // 发送文件
  const sendFile = async () => {
    let offset = 0
    let percent = 0
    const chunkSize = unref(sctp).maxMessageSize;
    const file = unref(fileList)[0]

    while(offset < file.size) {
      const chunk = file.slice(offset, offset + chunkSize)
      const buffer = await chunk.arrayBuffer()

      unref(dataChannel).send(buffer)

      // bufferedAmount 16777216 = 16GB 临界值
      // https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel/bufferedAmount
      // https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel/bufferedamountlow_event
      // https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel/bufferedAmountLowThreshold

      if (unref(dataChannel).bufferedAmount > unref(sctp).maxMessageSize * 2) {
        // 等待缓存队列降到阈值之下 预设buffer
        await new Promise(resolve => {
          unref(dataChannel).onbufferedamountlow = (ev) => {
            resolve(0);
          }
        });
      }

      offset += buffer.byteLength
      percent = offset / file.size
    }


    // 小文件
    // const buffer = await fileList[0].arrayBuffer()
    // dataChannel.send(buffer)
  }

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
        msgScreenRef.value.msgList.push({ type, data })
        groupListRef.value.getGroupList()
        break;
      case 'connect':
        renderChannelReq(data)
        break;
      case 'accept':
        create()
        console.log('接收方同意建立信道链接')
        break;
      case 'denied':
        console.log('接收方拒绝建立信道链接')
        break;
      case 'file-sender':
        console.log('发起方发送文件传输请求')
        fileReceiver.value = data
        fileReceiverRef.value.show(data)
        break;
      case 'file-receiver':
        console.log('接收方发送文件传输请求应答')
        if(data) {
          sendFile()
          console.log('接收方允许接收文件')
        } else {
          console.log('接收方拒绝接收文件')
        }
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
    console.log(unref(wsInstance))
    if (unref(wsInstance)) {
      sendMsg({
        type: 'connect',
        data: target
      })
    }
  }

  // 拒绝连接请求
  const handleChannelDenied = () => {
    sendMsg({
      type: 'denied'
    })
  }

  // 同意链接请求
  const handleChannelAccept = () => {
    sendMsg({
      type: 'accept'
    })

    // 接收方初始化连接
    receive()
  }

  const CurrentConnectionRef = ref()
  // 信道打开回调
  const handleChannelOpen = () => {
    console.log('信道开启')
    CurrentConnectionRef.value.show()

    // sctp
    getConnectionSCTP()
  }

  // 信道关闭回调
  const handleChannelClose = () => {
    console.log('信道关闭')
  }

  // 主动关闭信道
  const onChannelClose = () => {
    console.log('手动关闭信道')
    unref(dataChannel).close()
  }

  // 合并buffer
  const concatFileBuffer = function (buffers) {
    // 获取buffer总长度
    const bufferLength = buffers.reduce((count, next) => count + next.byteLength , 0)

    // 生成一个文件长度的arraybuffer
    let bufferFile = new Uint8Array(bufferLength)
    // 偏移
    let offset = 0

    // 在偏移位置set arraybuffer
    for(let buffer of buffers) {
      let sub = new Uint8Array(buffer)
      bufferFile.set(sub, offset)
      offset += buffer.byteLength
    }

    return bufferFile
  }


  // 信道消息接受回调
  const handleChannelMessage = (e) => {
    console.log('收到消息')

    if(typeof e.data === 'string') {
      msgScreenRef.value.msgList.value.push({
        type: 'text',
        data: {
          self: false,
          name: '密友',
          msg: e.data
        }
      })
    } else {
      const { name, type, size } = fileReceiver.value

      receiver.chunk.push(e.data)
      receiver.offset += e.data.byteLength

      if(receiver.offset === size) {
        const df = new Blob([concatFileBuffer(receiver.chunk)], { type })
        const link = document.createElement("a")
        link.href = window.URL.createObjectURL(df)
        link.style.display = 'none'
        link.download = name
        document.body.appendChild(link)
        link.click()
        window.URL.revokeObjectURL(link.href)
        document.body.removeChild(link)
      }
    } 
  }

  // 发起方信道创建
  const create = () => {
    createConnection()
    createChannel('arthur',{ negotiated: true, id: 117 })
    console.log('发起方创建信道')

    unref(dataChannel).onmessage = handleChannelMessage
    unref(dataChannel).onopen = handleChannelOpen
    unref(dataChannel).onclose = handleChannelClose

    createOffer()
  }

  // 接收方信道创建
  const receive = () => {
    createConnection()
    createChannel('arthur', { negotiated: true, id: 117 })
    console.log('接收方创建信道')

    unref(dataChannel).onmessage = handleChannelMessage
    unref(dataChannel).onopen = handleChannelOpen
    unref(dataChannel).onclose = handleChannelClose

    // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/sctp
    // https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel/negotiated
    // 
    // connection.ondatachannel = (e) => {
    //   console.log('reciver channel create!')
    //   console.log(dataChannel)
    //   dataChannel = e.channel
    //   dataChannel.onmessage = handleChannelMessage
    //   dataChannel.onopen = handleChannelOpen
    //   dataChannel.onclose = handleChannelClose
    // }
  }

  // 链接ws
  const handleWsOpen = () => {
    wsConnectBtnStatus.value = true
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
      createWsInstance()

      unref(wsInstance).onmessage = handleWsMsg
      unref(wsInstance).onopen = handleWsOpen
    }
  }

  // 发起方创建offer
  const createOffer = async() => {
    const offer = await unref(connection).createOffer()
    console.log('发起方 创建offer')
    await unref(connection).setLocalDescription(offer)
    console.log('发起方 将自创建的offer设置为本地描述')

    // ICE候选人的本地描述发生改变触发
    // https://developer.mozilla.org/zh-CN/docs/Web/API/RTCPeerConnection/icecandidate_event
    unref(connection).onicecandidate = async (event) => {
      if (event.candidate) {
        const offerSdp = unref(connection).localDescription
        console.log('发起方 在设置完自己的本地描述后 将其发送给信令服务器')

        // 发送 offer
        if (offerSdp) {
          sendMsg({
            type: 'offer',
            data: offerSdp
          })
        }
      }
    }
  }

  // 接收方创建answer
  const createAnswer = async (offer) => {
    unref(connection).onicecandidate = async (event) => {

      // 当一个新的 answer ICE candidate 被创建时
      if (event.candidate) {
        console.log('接收方 在设置完自己的本地描述后 将其发送给信令服务器')
        sendMsg({
          type: 'answer',
          data: unref(connection).localDescription
        })
      }
    }

    try {
      await unref(connection).setRemoteDescription(offer)
      console.log('接收方 将从信令服务器获取到的发起方的本地描述 设置成自己的远端描述')
      const answer = await unref(connection).createAnswer()
      console.log('接收方 创建一个应答')
      await unref(connection).setLocalDescription(answer)
      console.log('接收方 将自创建的应答设置为自己的本地描述')
    } catch (error) {
      console.log(error)
    }
  }

  // 发送方收到接收方的answer
  const receiveAnswer = async(answer) => {
    console.log('发起方 从信令服务器获取接收方的本地描述后 将其设置为自己的远程描述')
    // 添加 answer(应答)
    if (!unref(connection).currentRemoteDescription) {
      await unref(connection).setRemoteDescription(answer)
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

    <FileConfirm
      ref="fileReceiverRef"
      @close="handleConfirmClose"
    />

    <MsgScreen
      ref="msgScreenRef"
    />
  </div>

  <button @click="connect" :disabled="wsConnectBtnStatus">connection</button>

</template>

<style scoped lang="less">
.main-container {
  width: 972px;
  height: 695px;
  border: 1px solid #ccc;
  display: flex;
  overflow: hidden;
  position: relative;
} 
</style>
