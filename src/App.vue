<script setup>
import { ref, unref } from 'vue'
import GroupList from './components/GroupList.vue'
import ConnectionTips from './components/ConnectionTips.vue'
import CurrentConnection from './components/CurrentConnection.vue'
import FileConfirm from './components/FileConfirm.vue'
import MsgScreen from './components/MsgScreen.vue'
import SystemMessage from './components/SystemMessage.vue'
import ScreenShare from './components/ScreenShare.vue'
import ReqModal from './components/ReqModal.vue'
import { storeToRefs } from 'pinia'
import { useStore } from '/@/store/global.js'

  // store
  const store = useStore()
  const {
    wsInstance,
    connection,
    dataChannel,
    sctp,
    fileList
  } = storeToRefs(store)
  const {
    createWsInstance,
    createConnection,
    createChannel,
    getConnectionSCTP,
    sendMsg,
    resetFileList
  } = store

  const groupListRef = ref()
  const msgScreenRef = ref()
  const fileReceiverRef = ref()
  const systemMessageRef = ref()
  const screenShareRef = ref()
  const reqModalRef = ref()

  const wsConnectBtnStatus = ref(false)
  const abortStatus = ref(false)

  const fileReceiver = ref({})
  let receiver = {
    chunk: [],
    offset: 0
  }

  const percent = ref(0)

  // 关闭弹窗 手动关闭和信令服务器之间的ws连接
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
  
  // 发起方停止传输
  const senderAbortTransfer = () => {
    abortStatus.value = true
    resetFileList()
    percent.value = 0

    // 向接收方发送终止信号
    unref(dataChannel).send(
      JSON.stringify({
        type: 'action',
        data: 'file-break'
      })
    )

    unref(fileReceiverRef).hide()
    unref(systemMessageRef).show('文件传输已中止')
  }

  // 接收方重置传输
  const receiverResetTransfer = () => {
    percent.value = 0
    fileReceiver.value = {}
    Object.assign(
      receiver,
      {
        chunk: [],
        offset: 0
      }
    )
    abortStatus.value = false

    unref(fileReceiverRef).hide()
    unref(systemMessageRef).show('文件传输已中止')
  }

  // 手动取消传输
  const handleConfirmCancel = (sender) => {
    if (sender) { // 发起方取消
      senderAbortTransfer()
    } else { // 接收方取消
      unref(dataChannel).send(
        JSON.stringify({
          type: 'action',
          data: 'file-abort'
        })
      )

      abortStatus.value = true
    }
  }

  // 发送文件
  const sendFile = async () => {
    let offset = 0
    const chunkSize = unref(sctp).maxMessageSize
    const file = unref(fileList)[0]

    fileReceiverRef.value.show(
      {
        name: file.name,
        size: file.size
      },
      1
    )

    while(offset < file.size) {
      if (unref(abortStatus)) break;
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
      percent.value = Number((offset / file.size * 100).toFixed(2))
    }

    // 跳出发送循环后 abort复位
    if (abortStatus.value) abortStatus.value = false

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
        break;
      case 'denied':
        break;
      case 'file-sender':
        fileReceiver.value = data
        fileReceiverRef.value.show(data, 0)
        break;
      case 'file-receiver':
        if(data) {
          sendFile()
        }
        break;
      case 'stream-offer':
        createStreamAnswer(data)
        break;
      case 'stream-answer':
        receiveStreamAnswer(data)
        break;
      case 'new-ice-candidate':
        setNewICEcandidate(data)
        break;
      case 'stream-abort':
        unref(systemMessageRef).show('屏幕共享已中止')
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
    if (unref(wsInstance)) {
      sendMsg({
        type: 'connect',
        data: target
      })
    }
  }

  // 拒绝连接请求
  const handleChannelDenied = () => {
    sendMsg({ type: 'denied' })
  }

  // 同意链接请求
  const handleChannelAccept = () => {
    sendMsg({ type: 'accept' })

    // 接收方初始化连接
    receive()
  }

  const CurrentConnectionRef = ref()
  // 信道打开回调
  const handleChannelOpen = () => {
    CurrentConnectionRef.value.show()

    // sctp
    getConnectionSCTP()
  }

  // 信道关闭回调
  const handleChannelClose = () => {
  }

  // 主动关闭信道
  const onChannelClose = () => {
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
    console.log(e.data)

    if(typeof e.data === 'string') { // 普通消息接收
      const { type, data } = JSON.parse(e.data)

      if (type === 'text') {
        msgScreenRef.value.msgList.push({
          type: 'text',
          data: {
            self: false,
            name: '密友',
            msg: e.data
          }
        })
      } else {
        switch (data) {
          case 'file-break':
            receiverResetTransfer()
            return 
          case 'file-abort':
            senderAbortTransfer()
            return
          case 'share-req':
            unref(reqModalRef).show({ description: '请求分享屏幕' })
            return 
          case 'share-accept':
            unref(systemMessageRef).show('屏幕共享已被接受')
            unref(msgScreenRef).acceptStream()
            createStreamOffer()
            return
        }
      }
    } else { // 文件接收

      // 中止标识 即使收到arraybuffer也不再处理
      if (abortStatus.value) return false

      const {
        name,
        type,
        size
      } = fileReceiver.value

      receiver.chunk.push(e.data)
      receiver.offset += e.data.byteLength
      percent.value = Number((receiver.offset / size * 100).toFixed(2))

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

  // 轨道流
  const handleTrack = (ev) => {
    if (ev.streams && ev.streams[0]) {
      screenShareRef.value.setSource(ev.streams[0])
    } else {
      let inboundStream = new MediaStream(ev.track);
      screenShareRef.value.setSource(inboundStream)
    }
  }

  // 初始化 创建链接 创建信道
  const init = () => {
    createConnection()
    unref(connection).ontrack = handleTrack

    createChannel(
      'arthur',
      {
        negotiated: true,
        id: 117
      }
    )

    unref(dataChannel).onmessage = handleChannelMessage
    unref(dataChannel).onopen = handleChannelOpen
    unref(dataChannel).onclose = handleChannelClose
  }

  // 发起方信道创建
  const create = () => {
    init()
    createOffer()
  }

  // 接收方信道创建
  const receive = () => {
    init()
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
    await unref(connection).setLocalDescription(offer)

    // ICE候选人的本地描述发生改变触发
    // https://developer.mozilla.org/zh-CN/docs/Web/API/RTCPeerConnection/icecandidate_event
    unref(connection).onicecandidate = async (event) => {
      if (event.candidate) {
        const offerSdp = unref(connection).localDescription

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

  // 新发起一个流offer
  const createStreamOffer = async() => {
    const offer = await unref(connection).createOffer()
    await unref(connection).setLocalDescription(offer)

    sendMsg({
      type: "stream-offer",
      data: unref(connection).localDescription
    })

    unref(connection).onicecandidate = async (event) => {
      if (event.candidate) {
        sendMsg({
          type: "new-ice-candidate",
          data: event.candidate
        })
      }
    }
  }

  const setNewICEcandidate = (data) => {
    const candidate = new RTCIceCandidate(data)
    unref(connection).addIceCandidate(candidate)
  }

  // 接受一个流offer
  const createStreamAnswer = async (sdp) => {
    const desc = new RTCSessionDescription(sdp);
    await unref(connection).setRemoteDescription(desc)
    const answer = await unref(connection).createAnswer()
    await unref(connection).setLocalDescription(answer)
    sendMsg({
      type: "stream-answer",
      data: unref(connection).localDescription
    })
  }

  // 信道流发生改变
  const receiveStreamAnswer = async(answer) => {
    await unref(connection).setRemoteDescription(answer)
  }

  // 接收方创建answer
  const createAnswer = async (offer) => {
    unref(connection).onicecandidate = async (event) => {

      // 当一个新的 answer ICE candidate 被创建时
      if (event.candidate) {
        sendMsg({
          type: 'answer',
          data: unref(connection).localDescription
        })
      }
    }

    try {
      await unref(connection).setRemoteDescription(offer)
      const answer = await unref(connection).createAnswer()
      await unref(connection).setLocalDescription(answer)
    } catch (error) {
      console.log(error)
    }
  }

  // 发送方收到接收方的answer
  const receiveAnswer = async(answer) => {
    // 添加 answer(应答)
    if (!unref(connection).currentRemoteDescription) {
      await unref(connection).setRemoteDescription(answer)
    }
  }
</script>

<template>
  <div
    id="main"
    class="main-container"
  >
    
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
      :percent="percent"
      @close="handleConfirmClose"
      @cancel="handleConfirmCancel"
    />

    <MsgScreen
      ref="msgScreenRef"
    />
    
    <ReqModal
      ref="reqModalRef"
      @confirm="screenShareRef.show()"
    />

    <ScreenShare
      ref="screenShareRef"
    />
  </div>

  <button
    @click="connect"
    :disabled="wsConnectBtnStatus"
  >
    connection
  </button>

  <SystemMessage ref="systemMessageRef" />

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
