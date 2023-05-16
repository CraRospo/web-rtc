<script setup>
import { ref } from 'vue'
import LogoComp from './LogoComp.vue';
import emptyIconUrl from '/@/assets/empty.svg'

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
    <LogoComp class="logo-comp" />
    <div class="group-wrapper">
      <ul
        v-if="group.length"
        class="group-list"
      >
        <li
          class="group-item"
          v-for="g in group"
          :key="g.id"
          @mouseenter="current = g.id"
          @mouseleave="current = ''"
        >
          <img
            class="icon"
            :src="g.icon ?? 'https://placeholder.com/28x28.png'"
            alt="avatar"
          >
          <p class="name" :class="{ 'busy': g.status }">{{ g.name }}</p>
          <button
            class="connect-btn"
            :class="{ 'btn-show': current === g.id  }"
            @click="createConnection"
            :disabled="g.status"
          >
            connect
          </button>
        </li>
      </ul>
      <div
        v-else
        class="empty"
      >
        <img
          :src="emptyIconUrl"
          alt="empty"
        >
        <p class="empty-text">empty</p>
      </div>
    </div>
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
      padding-left: 12px;
      position: relative;
      flex: auto;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      font-size: 14px;
      text-align: left;
      &:before {
        content: '';
        position: absolute;
        width: 8px;
        height: 8px;
        top: 50%;
        left: 0;
        border-radius: 8px;
        margin-top: -4px;
        background-color: green;
      }
    }
    .busy {
      &:before {
        background-color: red;
      }
    }
  }
}
.group-wrapper {
  width: 100%;
  height: calc(100% - 48px);
  border-top: 1px solid #ccc;
}
.logo-comp {
  height: 48px;
}
.empty {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  .empty-text {
    margin-top: 16px;
    color: #bfbfbf;
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