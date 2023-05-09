import { defineStore } from 'pinia'

// useStore 可以是 useUser、useCart 之类的任何东西
// 第一个参数是应用程序中 store 的唯一 id
export const useStore = defineStore('main', {
  state: () => {
    return {
      wsInstance: null,
      connection: null,
      dataChannel: null,
      sctp: null,
      shareStream: null,
      fileList: []
    }
  },

  actions: {
    async createStream() {
      this.shareStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
    },

    createConnection() {
      this.connection = new RTCPeerConnection()
    },

    createChannel(name, options) {
      this.dataChannel = this.connection.createDataChannel(name, options)
    },

    createWsInstance(url = 'ws://127.0.0.1:8010') {
      this.wsInstance = new WebSocket(url)
    },

    getConnectionSCTP() {
      this.sctp = this.connection.sctp
    },

    resetFileList() {
      this.fileList = []
    },

    sendMsg(msg) {
      const strMsg = JSON.stringify(msg)
      this.wsInstance.send(strMsg)
    }
  }
})