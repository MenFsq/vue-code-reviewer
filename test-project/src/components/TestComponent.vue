
<template>
  <div>
    <ul>
      <li v-for="item in items" :key="item.id">
        {{ item.name }}
      </li>
    </ul>
    <div v-html="userContent"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'TestComponent',
  setup() {
    const items = ref([])
    const userContent = ref('')
    
    // 这里使用了any类型
    const processData = (data: any) => {
      return data
    }
    
    return {
      items,
      userContent,
      processData
    }
  }
})
</script>

<style scoped>
ul {
  list-style: none;
}
</style>
