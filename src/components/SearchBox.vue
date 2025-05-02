<template>
  <div class="search-box">
    <div class="search-title">位置搜索</div>
    <div class="search-input">
      <el-input
        v-model="searchText"
        placeholder="请输入地点名称"
        :prefix-icon="Search"
        clearable
        @input="handleSearch"
      />
    </div>
    <div class="search-results" v-show="searchResults.length > 0">
      <div
        v-for="item in searchResults"
        :key="item.id"
        class="result-item"
        @click="handleSelect(item)"
      >
        <div class="item-name">{{ item.name }}</div>
        <div class="item-address">{{ item.address }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps } from 'vue'
import { Search } from '@element-plus/icons-vue'
import mapboxgl from 'mapbox-gl'

const props = defineProps({
  map: {
    type: Object,
    required: true
  }
})

const searchText = ref('')
const searchResults = ref([])

// 搜索处理
const handleSearch = () => {
  if (!searchText.value) {
    searchResults.value = []
    return
  }

  // 从地图数据源中获取点数据
  const source = props.map.getSource('points')
  if (!source) return

  const features = source._data.features
  searchResults.value = features
    .filter(feature => 
      feature.properties.name.toLowerCase().includes(searchText.value.toLowerCase())
    )
    .slice(0, 5) // 限制显示前5条结果
    .map(feature => ({
      ...feature.properties,
      coordinates: feature.geometry.coordinates
    }))
}

// 选择搜索结果
const handleSelect = (item) => {
  const map = props.map
  if (!map) return

  // 飞到选中的位置
  map.flyTo({
    center: item.coordinates,
    zoom: 15,
    essential: true
  })

  // 显示 popup
  new mapboxgl.Popup({
    className: 'custom-popup',
    closeButton: false,
    maxWidth: '300px',
    offset: [0, -35]
  })
    .setLngLat(item.coordinates)
    .setHTML(`
      <div class="popup-content">
        <h3 class="popup-title">${item.name}</h3>
        <div class="popup-info">
          <p><span class="label">类型</span>${item.type}</p>
          <p><span class="label">电话</span>${item.tel}</p>
          <p><span class="label">地址</span>${item.address}</p>
          <p><span class="label">区域</span>${item.adname}</p>
        </div>
      </div>
    `)
    .addTo(map)

  searchText.value = ''
  searchResults.value = []
}
</script>

<style scoped>
.search-box {
  position: fixed;
  left: 60px;
  top: 13%;
  width: 300px;
  background: #fff;
  /* border: 1px solid #b2ffff; */
  border-radius: 4px;
  padding: 10px;
  color: #000;
  z-index: 1000;
  /* box-shadow: 0 0 10px rgba(178, 255, 255, 0.3); */
}

.search-title {
  font-size: 16px;
  color: #409EFF;
  border-bottom: 1px solid #CED9DA;
  padding-bottom: 10px;
  margin-bottom: 15px;
  text-align: center;
  font-family: 'YouSheBiaoTiHei', sans-serif;
}

.search-input {
  margin-bottom: 10px;
}
/* 
:deep(.el-input__wrapper) {
  background-color: rgba(178, 255, 255, 0.1);
  box-shadow: 0 0 0 1px #b2ffff;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #b2ffff;
}

:deep(.el-input__inner) {
  color: #fff;
  background: transparent;
}

:deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.5);
}

:deep(.el-input__prefix-icon) {
  color: #b2ffff;
} */

.search-results {
  max-height: 300px;
  overflow-y: auto;
}

.result-item {
  padding: 10px;
  cursor: pointer;
  border-bottom: 1px solid #000;
  transition: all 0.3s;
}

.result-item:hover {
  background: rgba(178, 255, 255, 0.1);
}

.result-item:last-child {
  border-bottom: none;
}

.item-name {
  color: #000;
  font-size: 14px;
  margin-bottom: 4px;
}

.item-address {
  color: #000;
  font-size: 12px;
}

/* 滚动条样式 */
/* .search-results::-webkit-scrollbar {
  width: 6px;
}

.search-results::-webkit-scrollbar-thumb {
  background: #b2ffff;
  border-radius: 3px;
}

.search-results::-webkit-scrollbar-track {
  background: rgba(178, 255, 255, 0.1);
} */
</style>
