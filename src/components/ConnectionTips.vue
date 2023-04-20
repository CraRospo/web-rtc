<script setup>
import { ref } from 'vue'

const visible = ref(false)
const name = ref('')

const emit = defineEmits(['accept', 'denied'])
const handleReq = (type) => {
  emit(type)
  visible.value = false
}

defineExpose({
  show(target) {
    visible.value = true
    name.value = target
  }
})

</script>

<template>
  <div class="tips-con">
    <div class="media-req-box" :class="{ 'show-req': visible }">
      {{ name }} 向您发起了链接请求

      <ul class="req-opt">
        <li class="accept" @click="handleReq('accept')">
          接受
        </li>
        <li class="denied" @click="handleReq('denied')">
          拒绝
        </li>
      </ul>
    </div>
  </div>
</template>

<style lang="less" scoped>
.tips-con {
  width: 300px;
  position: absolute;
  bottom: 0;
  left: 0;
}
.media-req-box {
  box-sizing: border-box;
  position: absolute;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 100%;
  height: 100px;
  border: 1px solid #ff0000;
  bottom: -100px;
  left: 0;
  background: #fff;
  z-index: 2;
  transition: all ease-in-out .6s;
  .req-opt {
    flex: none;
    width: 100%;
    height: 40px;
    display: flex;
    align-items: center;
    & > li {
      & + li {
        border-left: 1px solid #ccc;
      }
      border-top: 1px solid #ccc;
      height: 100%;
      line-height: 40px;
      flex: 1;
    }
    .accept {
      color: green;
    }
    .denied {
      color: #ff0000;
    }
  }
}
.show-req {
  bottom: 0;
}
</style>