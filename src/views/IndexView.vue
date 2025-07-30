<template>
  <div class="index">
    <RouterLink :to="route.path" v-for="(route, index) in routes" :key="route.path">{{ route.name }}</RouterLink>
  </div>
</template>
<script setup>
import { RouterLink } from 'vue-router'
import {routes} from '../router/index'
console.info(routes);
</script>
<style lang="css" scoped>
.index a {
    display: inline-block;
    margin: 20px;
  }
</style>