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
      target: '',
      fileList: []
    }
  },

  actions: {
    async createStream() {
      try {
        this.shareStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false }) 
      } catch (error) {
        console.log(error)
      }
    },

    setTarget(id) {
      this.target = id
    },

    createConnection() {
      this.connection = new RTCPeerConnection()
    },

    createChannel(name, options) {
      this.dataChannel = this.connection.createDataChannel(name, options)
    },

    createWsInstance() {
      const url = import.meta.env.MODE === 'production'
        ? 'wss://124.223.71.232:8010'
        : 'wss://127.0.0.1:8010' 
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
    },

    closeConnection() {
      this.dataChannel.close()
      this.connection.close()
      this.target = ''
    }
  }
})