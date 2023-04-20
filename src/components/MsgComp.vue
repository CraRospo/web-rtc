<script setup>
const props = defineProps({
  msg: {}
})

const { type, data = {} } = props.msg
const { msg, name, self } = data

</script>

<template>
  <div
    class="msg-container"
    :class="{ 'self-msg': self }"
  >
    <div
      v-if="type !== 'system' && !self"
      class="contact-name"
    >
      {{ name }}
    </div>
    <div
      class="msg-box"
      :class="{ 'system-msg': type === 'system' }"
    >
      {{ msg }}
    </div>
  </div>
</template>

<style lang="less">
.msg-container {
  padding: 6px 10px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.msg-container.self-msg {
  align-items: flex-end;
}
.contact-name {
  font-size: 14px;
  color: #ccc;
}
.msg-box {
  max-width: 80%;
  padding: 4px 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 16px;
  color: #333;
  text-align: left;
}
.system-msg {
  padding: 0 4px;
  margin: 0 auto;
  font-size: 12px;
  color: #fff;
  border-radius: 2px;
  background: #ccc;
}
</style>