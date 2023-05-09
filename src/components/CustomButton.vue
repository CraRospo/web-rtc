<template>
  <button class="custom-button">
    <slot>
      Button
    </slot>
  </button>
</template>

<style lang="less" scoped>
.custom-button {
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
  color: #333;
  background: #fff;
  transition: all ease-in-out .2s;
  &:hover {
    box-shadow: 0 0 10px 2px #e7e7e7;
  }
}
</style>