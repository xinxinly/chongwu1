<template>
  <div v-if="visible" class="route-control">
    <div class="route-header">
      <div class="route-title">路径规划</div>
      <el-icon class="close-icon" @click="handleClose">
        <Close />
      </el-icon>
    </div>
    <div class="route-content">
      <div class="point-select">
        <div class="point-item">
          <span class="point-label">起点坐标:</span>
          <span class="point-value">{{ startPoint.lng ? `${startPoint.lng}, ${startPoint.lat}` : '未选择' }}</span>
          <el-button 
            size="small" 
            type="primary" 
            :disabled="isSelectingStart || startPoint.lng" 
            @click="startSelectPoint('start')"
          >
            选择起点
          </el-button>
        </div>
        <div class="point-item">
          <span class="point-label">终点坐标:</span>
          <span class="point-value">{{ endPoint.lng ? `${endPoint.lng}, ${endPoint.lat}` : '未选择' }}</span>
          <el-button 
            size="small" 
            type="primary" 
            :disabled="isSelectingEnd || endPoint.lng" 
            @click="startSelectPoint('end')"
          >
            选择终点
          </el-button>
        </div>
      </div>
      <div class="route-buttons">
        <el-button 
          type="primary" 
          :class="{ active: isLoading }"
          :disabled="!startPoint.lng || !endPoint.lng || isLoading"
          @click="planRoute"
        >
          <el-icon><Location /></el-icon>
          {{ isLoading ? '规划中...' : '路径规划' }}
        </el-button>
        <el-button 
          type="danger" 
          @click="clearRoute"
        >
          <el-icon><Delete /></el-icon>
          清除规划
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, defineProps, defineEmits } from 'vue'
import { Close, Location, Delete } from '@element-plus/icons-vue'
import mapboxgl from 'mapbox-gl'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { addPointsFromMap, removePointsFromMap } from '@/utils/mapPoints'

const emit = defineEmits(['update:visible'])

const visible = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

let map = null
const startPoint = ref({ lng: null, lat: null })
const endPoint = ref({ lng: null, lat: null })
const isSelectingStart = ref(false)
const isSelectingEnd = ref(false)
const isLoading = ref(false)

// 存储标记和路线图层
const markers = []
const routeLayers = []
const routeSources = []

// 开始选择点位
const startSelectPoint = (type) => {
  if (type === 'start') {
    isSelectingStart.value = true
    if (map && map.getCanvas()) {
      map.getCanvas().style.cursor = 'crosshair'
    }
    map.once('click', handleMapClick)
  } else {
    isSelectingEnd.value = true
    if (map && map.getCanvas()) {
      map.getCanvas().style.cursor = 'crosshair'
    }
    map.once('click', handleMapClick)
  }
}

// 处理地图点击事件
const handleMapClick = (e) => {
  const lngLat = e.lngLat
  
  if (isSelectingStart.value) {
    startPoint.value = { lng: (lngLat.lng).toFixed(4), lat: (lngLat.lat).toFixed(4) }
    isSelectingStart.value = false
    addMarkerToMap('start', lngLat)
  } else if (isSelectingEnd.value) {
    endPoint.value = { lng: (lngLat.lng).toFixed(4), lat: (lngLat.lat).toFixed(4) }
    isSelectingEnd.value = false
    addMarkerToMap('end', lngLat)
  }
  
  if (map && map.getCanvas()) {
    map.getCanvas().style.cursor = ''
  }
}

// 在地图上添加标记
const addMarkerToMap = (type, lngLat) => {
  try {
    // 创建自定义元素
    const el = document.createElement('div')
    el.className = 'custom-marker'
    el.style.backgroundImage = `url(./images/${type}.svg)`
    el.style.width = '32px'
    el.style.height = '32px'
    el.style.backgroundSize = 'cover'
    el.style.backgroundRepeat = 'no-repeat'
    
    // 创建标记
    const marker = new mapboxgl.Marker(el)
      .setLngLat(lngLat)
      .addTo(map)
    
    // 存储标记以便后续移除
    markers.push(marker)
  } catch (error) {
    console.error('添加标记时出错:', error)
  }
}

// 规划路线
const planRoute = async () => {
  if (!startPoint.value.lng || !endPoint.value.lng) {
    ElMessage.warning('请先选择起点和终点')
    return
  }
  
  isLoading.value = true
  
  try {
    // 调用高德地图路径规划API
    const response = await axios.get('https://restapi.amap.com/v3/direction/driving', {
      params: {
        key: '5e6b13ba8c8694ac6b792fa4a176535b', // 需要替换为实际的高德地图API密钥
        origin: `${startPoint.value.lng},${startPoint.value.lat}`,
        destination: `${endPoint.value.lng},${endPoint.value.lat}`,
        extensions: 'all',
        strategy: 0,
        output: 'json'
      }
    })
    if (response.data.count === '1') {
      const route = response.data.route
      const path = route.paths[0]
      
      // 解析路径坐标
      const coordinates = []
      
      path.steps.forEach(step => {
        const polyline = step.polyline.split(';')
        polyline.forEach(point => {
          const [lng, lat] = point.split(',')
          coordinates.push([parseFloat(lng), parseFloat(lat)])
        })
      })
      // 添加路线到地图
      addRouteToMap(coordinates)
      
      ElMessage.success('路径规划成功')
    } else {
      ElMessage.error('路径规划失败: ' + response.data.info)
    }
  } catch (error) {
    console.error('规划路线时出错:', error)
    ElMessage.error('路径规划请求失败，请稍后再试')
  } finally {
    isLoading.value = false
  }
}

// 添加路线到地图
const addRouteToMap = (coordinates) => {
  try {
    // 移除现有路线
    clearRouteLayers()
    
    // 添加路线数据源
    const sourceId = 'route-source'
    map.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: coordinates
        }
      }
    })
    routeSources.push(sourceId)
    
    // 添加路线图层
    const layerId = 'route-layer'
    map.addLayer({
      id: layerId,
      type: 'line',
      source: sourceId,
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#1296DB',
        'line-width': 5,
        'line-opacity': 0.8
      }
    })
    routeLayers.push(layerId)
    
    // 调整地图视图以显示整条路线
    const bounds = coordinates.reduce((bounds, coord) => {
      return bounds.extend(coord)
    }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]))
    
    map.fitBounds(bounds, {
      padding: 100,
      maxZoom: 15
    })
  } catch (error) {
    console.error('添加路线到地图时出错:', error)
  }
}

// 清除路线图层
const clearRouteLayers = () => {
  try {
    // 移除图层
    routeLayers.forEach(layerId => {
      if (map && map.getLayer(layerId)) {
        map.removeLayer(layerId)
      }
    })
    
    // 移除源
    routeSources.forEach(sourceId => {
      if (map && map.getSource(sourceId)) {
        map.removeSource(sourceId)
      }
    })
    
    // 清空数组
    routeLayers.length = 0
    routeSources.length = 0
  } catch (error) {
    console.error('清除路线图层时出错:', error)
  }
}

// 清除路线
const clearRoute = () => {
  // 移除标记
  markers.forEach(marker => {
    marker.remove()
  })
  markers.length = 0
  
  // 清除路线图层
  clearRouteLayers()
  
  // 重置坐标
  startPoint.value = { lng: null, lat: null }
  endPoint.value = { lng: null, lat: null }
  isSelectingStart.value = false
  isSelectingEnd.value = false
  
  if (map && map.getCanvas()) {
    map.getCanvas().style.cursor = ''
  }
}

// 关闭面板
const handleClose = () => {
  try {
    clearRoute()
  } catch (error) {
    console.error('关闭面板时出错:', error)
  }
  emit('update:visible', false)
}

onMounted(() => {
  try {
    // 每次挂载时重新获取map对象
    map = window.map
    removePointsFromMap(map)
    if (!map) {
      console.warn('无法获取地图对象 map')
    }
  } catch (error) {
    console.error('组件挂载时出错:', error)
  }
})

onUnmounted(() => {
  try {
    clearRoute()
    addPointsFromMap(map)
  } catch (error) {
    console.error('组件卸载时清理资源出错:', error)
  } finally {
    map = null
  }
})
</script>

<style scoped>
.route-control {
  position: fixed;
  top: 12%;
  right: 240px;
  width: 450px;
  background: #fff;
  border: 1px solid #000;
  border-radius: 4px;
  padding: 15px;
  color: #000;
  z-index: 1000;
  box-shadow: 0 0 10px rgba(178, 255, 255, 0.3);
}

.route-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(27,27,27, 0.3);
}

.route-title {
  font-size: 16px;
  color: #000;
  font-family: 'YouSheBiaoTiHei', sans-serif;
}

.close-icon {
  color: #000;
  cursor: pointer;
  transition: all 0.3s;
}

.close-icon:hover {
  transform: scale(1.1);
}

.route-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.point-select {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.point-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.point-label {
  font-weight: bold;
  color: #000;
  width: 70px;
}

.point-value {
  flex: 1;
  font-family: monospace;
  padding: 4px 8px;
  background: rgba(178, 255, 255, 0.1);
  border-radius: 3px;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.route-buttons {
  display: flex;
  gap: 10px;
  margin-top: 5px;
}

:deep(.el-button) {
  flex: 1;
  /* background: #0b2626;
  border-color: #b2ffff;
  color: #b2ffff; */
}

/* :deep(.el-button:hover) {
  background: rgba(178, 255, 255, 0.1);
  border-color: #b2ffff;
  color: #b2ffff;
} */

/* :deep(.el-button:disabled) {
  background: rgba(178, 255, 255, 0.05);
  border-color: rgba(178, 255, 255, 0.3);
  color: rgba(178, 255, 255, 0.5);
} */

/* :deep(.el-button.active) {
  background: rgba(178, 255, 255, 0.2);
  border-color: #b2ffff;
  color: #b2ffff;
} */

/* :deep(.el-button.el-button--primary:not(:disabled)) {
  background: #0b2626;
} */

/* :deep(.el-button.el-button--primary:hover:not(:disabled)) {
  background: rgba(178, 255, 255, 0.1);
} */
/* 
:deep(.el-button.el-button--danger:not(:disabled)) {
  background: #0b2626;
}

:deep(.el-button.el-button--danger:hover:not(:disabled)) {
  background: rgba(178, 255, 255, 0.1);
} */

:deep(.el-icon) {
  margin-right: 4px;
}
</style>
