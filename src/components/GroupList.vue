<script setup>
import { ref } from 'vue'

const group = ref([])
const current = ref('')

// 获取群列表
const getGroupList = async () => {
  const res = await fetch('/api/group',
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )

  const { code, data } = await res.json()
  if (code === 0) {
    group.value = data
  }
}

const emit = defineEmits(['connect'])
const createConnection = () => {
  emit('connect', current.value)
}

// 外部调用
defineExpose({
  getGroupList() {
    getGroupList()
  }
})

</script>

<template>
  <div class="group">
    <ul class="group-list">
      <li class="group-item" v-for="g in group" :key="g.id" @mouseenter="current = g.id" @mouseleave="current = ''">
        <img class="icon" :src="g.icon ?? 'https://placeholder.com/28x28.png'" alt="">
        <p class="name">{{ g.name }}</p>
        <button class="connect-btn" :class="{ 'btn-show': current === g.id  }" @click="createConnection">connect</button>
      </li>
    </ul>
  </div>
</template>

<style lang="less" scoped>
.group {
  position: relative;
  flex: none;
  width: 300px;
  height: 100%;
  border-right: 1px solid #ccc;
}
.group-list {

  .group-item {
    flex: none;
    padding: 6px 8px;
    display: flex;
    align-items: center;
    border-bottom: 1px solid #ccc;
    gap: 12px;
    .icon {
      flex: none;
      width: 28px;
      height: 28px;
    }
    .name {
      flex: auto;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      font-size: 14px;
      text-align: left;
    }
  }
}
.connect-btn {
  padding: 4px 8px;
  opacity: 0;
  transition: all ease-in-out .2s;
  border-radius: 4px;
  border: 1px solid #ccc;
  color: #666;
}
.btn-show {
  opacity: 1;
}
</style>