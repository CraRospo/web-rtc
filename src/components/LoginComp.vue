<script setup>
import { reactive, ref } from 'vue';
import LogoUrl from '/@/assets/logo.png'
import { digestMessage } from '/@/utils/util'

const showLogin = ref(true)

const userInfo = reactive({
  username: '',
  password: ''
})

const formItemState = reactive({
  username: {
    inValid: false,
    message: ''
  },
  password: {
    inValid: false,
    message: ''
  }
})

const checkForm = () => {
  if (!userInfo.username) {
    Object.assign(formItemState.username, {
      inValid: true,
      message: '用户名不能为空'
    })
  } else {
    if (!/.{5,16}/.test(userInfo.username)) {
      Object.assign(formItemState.username, {
        inValid: true,
        message: '用户名应为5-16位'
      })
    } else {
      Object.assign(formItemState.username, {
        inValid: false,
        message: ''
      })
    }
  }
  if (!userInfo.password) {
    Object.assign(formItemState.password, {
      inValid: true,
      message: '密码不能为空'
    })
  } else {
    if (!/.{5,16}/.test(userInfo.password)) {
      Object.assign(formItemState.password, {
        inValid: true,
        message: '密码应为6-16位'
      })
    } else {
      Object.assign(formItemState.password, {
        inValid: false,
        message: ''
      })
    }
  }

  if(!formItemState.password.inValid && !formItemState.username.inValid) return true
}

const emit = defineEmits(['success'])

const onLogin = async () => {
  if(!checkForm()) return false

  const digestHex = await digestMessage(userInfo.password)
  const info = {
    username: userInfo.username,
    password: digestHex
  }

  const res = await fetch('/api/login',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(info)
    }
  )

  const response = await res.json()
  localStorage.setItem('oc_name', userInfo.username)

  if (response.code === 0) {
    showLogin.value = false
    emit('success')
  }
}

</script>

<template>
  <div class="login-mask" v-show="showLogin">
    <div class="login-form">
      <h1 class="login-title">
        <img
          class="logo"
          :src="LogoUrl"
          alt="logo"
        >  
        Our Chat
      </h1>
      <div class="form-item">
        <label
          class="form-item-name"
          for="username"
        >
          用户名：
        </label>
        <input
          class="form-item-input"
          :class="{ 'invalid-form-item': formItemState.username.inValid }"
          type="text"
          name="username"
          v-model="userInfo.username"
          @input="checkForm"
        >
        <p v-if="formItemState.username.inValid" class="invalid-text">{{ formItemState.username.message }}</p>
      </div>

      <div class="form-item">
        <label
          class="form-item-name"
          for="password"
        >
          密码：
        </label>
        <input
          class="form-item-input"
          :class="{ 'invalid-form-item': formItemState.password.inValid }"
          type="password"
          name="password"
          v-model="userInfo.password"
          @input="checkForm"
        >
        <p v-if="formItemState.password.inValid" class="invalid-text">{{ formItemState.password.message }}</p>
      </div>

      <div class="form-item">
        <label class="form-item-name"></label>
        <button
          class="login-btn "
          @click="onLogin"
        >
          登录
        </button>
      </div>

      <!-- <p class="register-tips">Please agree our <router-link :to="{ 'name': 'PrivateProtocal' }">protocal</router-link> before you signin. </p> -->
    </div>
  </div>
</template>

<style scoped>
.login-mask {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background-color: #fff;
  z-index: 101;
}
.login-title {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.login-title .logo {
  flex: none;
  width: 32px;
  margin-right: 12px;
}
.login-form {
  position: relative;
  max-width: 400px;
  left: 50%;
  top: 40%;
  width: 100%;
  transform: translate(-50%, -50%);
}
.form-item {
  padding: 10px 20px;
}
.form-item-name {
  display: block;
  text-align: left;
  margin-bottom: 8px;
}
.form-item-input {
  box-sizing: border-box;
  width: 100%;
  padding: 0 6px;
  height: 30px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}
.form-item-input:focus {
  border-color: #409eff;
}
.login-btn {
  box-sizing: border-box;
  width: 100%;
  height: 32px;
  padding: 4px 10px;
  background-color: #409eff;
  border-radius: 4px;
  color: #fff;
}
.register-tips {
  text-align: center;
}
.invalid-form-item {
  border-color: var(--warning-color);
}
.invalid-form-item:focus {
  border-color: var(--warning-color);
}
.invalid-text {
  text-align: left;
  margin: 4px 0 0;
  font-size: 14px;
  color: var(--warning-color);
}
</style>