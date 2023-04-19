<script setup>
import { ref } from 'vue'
  let wsInstance = null
  let connection = null
  let dataChannel = null

  const msg = ref('')

  const handleChannelOpen = () => {
    console.log('channel open')
  }

  const handleChannelClose = () => {
    console.log('channel close')
  }

  const handleChannelMessage = (e) => {
    console.log('Message receive!')
    console.log(e.data)
  }

  // ws信道服务转发处理
  const handleWsMsg = async (e) => {
    const { type, data } = JSON.parse(e.data)
    if (type === 'offer') {
      await createAnswer(data)
    } else if (type === 'answer') {
      await receiveAnswer(data)
    } else if (type === 'system') {
      console.log(`system msg: ${data.msg}`)
    }
  }

  // 发起信道创建
  const create = () => {
    dataChannel = connection.createDataChannel('arthur')
    console.log('创建信道')

    dataChannel.onmessage = handleChannelMessage
    dataChannel.onopen = handleChannelOpen
    dataChannel.onclose = handleChannelClose

    createOffer()
  }

  // 发送信道消息
  const send = () => {
    console.log(msg.value)
    const message = msg.value
    dataChannel.send(message)
    // wsInstance.send(JSON.stringify({
      
    //   type: 'text',
    //   data: message
    // }))
  }

  // 链接ws 创建rtc-connection
  const handleWsOpen = () => {
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

    // wsInstance.send(JSON.stringify({
    //   type: 'offer',
    //   data: connection.localDescription
    // }))

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
        // wsInstance.send(JSON.stringify({
        //   type: 'answer',
        //   data: connection.localDescription
        // }))
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
  <button @click="connect">connection</button>

  <input type="text" v-model="msg">
  <button @click="send">send</button>
  <button @click="create">create</button>
</template>

<style scoped>
</style>
