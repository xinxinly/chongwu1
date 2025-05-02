<template>
  <div v-if="visible" class="service-query">
    <div class="service-header">
      <div class="service-title">服务查询</div>
      <el-icon class="close-icon" @click="handleClose">
        <Close />
      </el-icon>
    </div>
    <div class="service-content">
      <div class="radius-select">
        <el-radio-group v-model="selectedRadius" size="small" @change="handleRadiusChange">
          <el-radio-button label="1">1km</el-radio-button>
          <el-radio-button label="3">3km</el-radio-button>
          <el-radio-button label="7">7km</el-radio-button>
          <el-radio-button label="10">10km</el-radio-button>
        </el-radio-group>
      </div>
      <div class="service-buttons">
        <el-button 
          type="primary" 
          :class="{ active: isQuerying }"
          @click="toggleQuery"
        >
          <el-icon><Search /></el-icon>
          {{ isQuerying ? '正在查询' : '服务查询' }}
        </el-button>
        <el-button 
          type="danger" 
          @click="clearQuery"
        >
          <el-icon><Delete /></el-icon>
          清除查询
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onUnmounted, onMounted, defineProps, defineEmits, ref } from 'vue'
import { Close, Search, Delete } from '@element-plus/icons-vue'
import { togglePointsVisibility, removePointsFromMap, addPointsFromMap } from '@/utils/mapPoints'
import * as turf from '@turf/turf'
import mapboxgl from 'mapbox-gl'

const emit = defineEmits(['update:visible'])

const isQuerying = ref(false)
const selectedRadius = ref('')
const visible = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

let map = null
let startPoint = null
let circleLayer = null
let circleSource = null
let isDrawing = false

// 图标映射
const iconMap = {
  business: './images/business.png',
  park: './images/park.png',
  hospital: './images/hospital.png'
}

// 存储临时图层和源的ID
const tempLayers = []
const tempSources = []

// 初始化圆形图层
const initCircleLayer = () => {
  if (!map.getSource('query-circle')) {
    map.addSource('query-circle', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: []
        }
      }
    })
    circleSource = true
    map.addLayer({
      id: 'query-circle',
      type: 'fill',
      source: 'query-circle',
      paint: {
        'fill-color': '#b2ffff',
        'fill-opacity': 0.5,
        'fill-outline-color': '#b2ffff'
      }
    })
    map.addLayer({
      id: 'query-circle-bounds',
      type: 'line',
      source: 'query-circle',
      layout: {},
      paint: {
        'line-color': '#b2ffff',
        'line-width': 1.5
      }
    })
    circleLayer = true
  }
}

// 更新圆形
const updateCircle = (center, radius, type = false) => {
  if (!Array.isArray(center) || center.length !== 2) return

  const circle = turf.circle(center, radius, {
    units: 'kilometers',
    steps: 64
  })

  if (map.getSource('query-circle')) {
    map.getSource('query-circle').setData(circle)
  }
  if (type) {
    showPointsInCircle(center, radius)
  }
}

// 显示圆内的点
const showPointsInCircle = async (center, radius) => {
  // 清除之前的临时图层
  removeTempLayers()
  
  // 创建圆形多边形
  const circlePolygon = turf.circle(center, radius, {
    units: 'kilometers',
    steps: 64
  })
  
  // 获取原始数据
  const mainSource = map.getSource('points')
  if (!mainSource) return
  
  const features = mainSource._data.features
  
  // 按类别分类
  const categories = ['business', 'park', 'hospital']
  
  for (const category of categories) {
    // 过滤当前类别的点
    const categoryPoints = features.filter(feature => feature.properties.categories === category)
    
    // 过滤在圆内的点
    const pointsInCircle = categoryPoints.filter(point => 
      turf.booleanPointInPolygon(
        turf.point(point.geometry.coordinates), 
        circlePolygon
      )
    )
    
    // 如果没有点在圆内，跳过
    if (pointsInCircle.length === 0) continue
    
    // 创建临时数据源
    const sourceId = `circle-${category}-source`
    
    // 添加源
    map.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: pointsInCircle
      }
    })
    
    tempSources.push(sourceId)
    
    // 添加图层
    const layerId = `circle-${category}-layer`
    
    // 检查图标是否已加载
    if (!map.hasImage(`${category}-icon`)) {
      // 如果图标未加载，加载图标
      await new Promise((resolve, reject) => {
        map.loadImage(iconMap[category], (error, image) => {
          if (error) {
            console.error(`无法加载图标: ${category}`, error)
            reject(error)
          } else {
            map.addImage(`${category}-icon`, image)
            resolve()
          }
        })
      }).catch(err => console.error('加载图标失败:', err))
    }
    
    // 添加显示图层
    map.addLayer({
      id: layerId,
      type: 'symbol',
      source: sourceId,
      layout: {
        'icon-image': `${category}-icon`,
        'icon-size': 0.5,
        'icon-anchor': 'bottom',
        // 确保图标始终可见，不受缩放级别影响
        'icon-allow-overlap': true,
        'icon-ignore-placement': true
      }
    })
    
    tempLayers.push(layerId)
    
    // 添加点击和悬停事件
    addLayerListeners(layerId)
  }
}

// 添加图层事件监听器
const addLayerListeners = (layerId) => {
  if (!map) return
  
  try {
    // 添加点击事件
    map.on('click', layerId, handleLayerClick)
    // 添加鼠标悬停效果
    map.on('mouseenter', layerId, () => {
      if (map && map.getCanvas()) {
        map.getCanvas().style.cursor = 'pointer'
      }
    })
    map.on('mouseleave', layerId, () => {
      if (map && map.getCanvas()) {
        map.getCanvas().style.cursor = ''
      }
    })
  } catch (error) {
    console.error('添加事件监听器出错:', error)
  }
}

// 移除图层事件监听器
const removeLayerListeners = (layerId) => {
  if (!map || !layerId) return
  
  map.off('click', layerId, handleLayerClick)
  map.off('mouseenter', layerId)
  map.off('mouseleave', layerId)
}

// 处理图层点击事件
const handleLayerClick = (e) => {
  if (e.features && e.features.length > 0) {
    const feature = e.features[0]
    const properties = feature.properties
    const coordinates = feature.geometry.coordinates.slice()
    
    // 创建弹出窗口
    new mapboxgl.Popup({
      className: 'custom-popup',
      closeButton: false,
      maxWidth: '300px',
      offset: [0, -35]
    })
      .setLngLat(coordinates)
      .setHTML(`
        <div class="popup-content">
          <h3 class="popup-title">${properties.name}</h3>
          <div class="popup-info">
            <p><span class="label">类型</span>${properties.type}</p>
            <p><span class="label">电话</span>${properties.tel}</p>
            <p><span class="label">地址</span>${properties.address}</p>
            <p><span class="label">区域</span>${properties.adname}</p>
          </div>
        </div>
      `)
      .addTo(map)
  }
}

// 清除临时图层
const removeTempLayers = () => {
  try {
    // 移除图层
    tempLayers.forEach(layerId => {
      if (map && map.getLayer(layerId)) {
        // 移除事件监听器
        removeLayerListeners(layerId)
        // 移除图层
        map.removeLayer(layerId)
      }
    })
    // 移除源
    tempSources.forEach(sourceId => {
      if (map && map.getSource(sourceId)) {
        map.removeSource(sourceId)
      }
    })
    // 清空数组
    tempLayers.length = 0
    tempSources.length = 0
  } catch (error) {
    console.error('清除临时图层时出错:', error)
  }
}

// 处理鼠标按下事件
const handleMouseDown = (e) => {
  if (!isDrawing) {
    // 第一次点击，开始绘制
    isDrawing = true
    startPoint = [e.lngLat.lng, e.lngLat.lat]
    // 显示默认半径的圆
    map.on('mousemove', handleMouseMove)
  } else {
    const endPoint = [e.lngLat.lng, e.lngLat.lat]
    const radius = turf.distance(turf.point(startPoint), turf.point(endPoint), { units: 'kilometers' })
    // 更新圆形为最终大小
    updateCircle(startPoint, radius)
    showPointsInCircle(startPoint, radius)
    // 重置状态
    isDrawing = false
    isQuerying.value = false
    map.getCanvas().style.cursor = ''
    map.off('mousemove', handleMouseMove)
    map.off('mousedown', handleMouseDown)
  }
}

// 处理鼠标移动事件
const handleMouseMove = (e) => {
  if (!isDrawing || !startPoint || !map) return
  
  try {
    const currentPoint = [e.lngLat.lng, e.lngLat.lat]
    const radius = turf.distance(turf.point(startPoint), turf.point(currentPoint), { units: 'kilometers' })
    updateCircle(startPoint, radius)
  } catch (error) {
    console.error('鼠标移动处理出错:', error)
  }
}

// 开始/停止查询
const toggleQuery = () => {
  if (!map) {
    map = window.map // 确保map是最新的
  }
  
  isQuerying.value = !isQuerying.value
  if (isQuerying.value) {
    try {
      removeTempLayers()
      initCircleLayer()
      if (map.getSource('query-circle')) {
        map.getSource('query-circle').setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Point',
            coordinates: []
          }
        })
      }
      if (map && map.getCanvas()) {
        map.getCanvas().style.cursor = 'crosshair'
      }
      map.on('mousedown', handleMouseDown)
    } catch (error) {
      console.error('开始查询时出错:', error)
      isQuerying.value = false
    }
  } else {
    try {
      if (map && map.getCanvas()) {
        map.getCanvas().style.cursor = ''
      }
      map.off('mousedown', handleMouseDown)
      map.off('mousemove', handleMouseMove)
    } catch (error) {
      console.error('停止查询时出错:', error)
    }
  }
}
const handleRadiusChange = (newRadius) => {
  if (map.getSource('query-circle')) {
    if (startPoint) {
      updateCircle(startPoint, parseInt(newRadius), true)
    }
  }
}

// 清除查询
const clearQuery = () => {
  if (map.getSource('query-circle')) {
    map.getSource('query-circle').setData({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Point',
        coordinates: []
      }
    })
  }
  // 清除临时图层
  removeTempLayers()
  isQuerying.value = false
  map.getCanvas().style.cursor = ''
  map.off('mousedown', handleMouseDown)
  map.off('mousemove', handleMouseMove)
  startPoint = null
  isDrawing = false
}

// 关闭面板
const handleClose = () => {
  try {
    // 先清除所有事件监听器
    if (map) {
      map.off('mousedown', handleMouseDown)
      map.off('mousemove', handleMouseMove)
    }
    // 清除查询
    clearQuery()
  } catch (error) {
    console.error('关闭面板时出错:', error)
  }
  // 更新可见性
  emit('update:visible', false)
}

onMounted(() => {
  try {
    // 每次挂载时重新获取map对象
    map = window.map
    if (map) {
      // 初始化圆形图层
      initCircleLayer()
      togglePointsVisibility(map, 'business', false) 
      togglePointsVisibility(map, 'park', false)
      togglePointsVisibility(map, 'hospital', false)
      removePointsFromMap(map)
    } else {
      console.warn('无法获取地图对象 map')
    }
  } catch (error) {
    console.error('组件挂载时出错:', error)
  }
})

onUnmounted(() => {
  try {
    if (map) {
      // 清除所有事件监听器
      map.off('mousedown', handleMouseDown)
      map.off('mousemove', handleMouseMove)
      
      // 清除圆形图层
      if (circleLayer) {
        if (map.getLayer('query-circle')) {
          map.removeLayer('query-circle')
        }
        if (map.getLayer('query-circle-bounds')) {
          map.removeLayer('query-circle-bounds')
        }
      }
      if (circleSource) {
        if (map.getSource('query-circle')) {
          map.removeSource('query-circle')
        }
      }
      
      // 清除临时图层
      removeTempLayers()
      togglePointsVisibility(map, 'business', true) 
      togglePointsVisibility(map, 'park', true)
      togglePointsVisibility(map, 'hospital', true)
      addPointsFromMap(map)
    }
  } catch (error) {
    console.error('组件卸载时清理资源出错:', error)
  } finally {
    // 重置所有状态变量
    circleLayer = null
    circleSource = null
    startPoint = null
    isDrawing = false
    map = null
  }
})
</script>

<style scoped>
.service-query {
  position: fixed;
  top: 12%;
  right: 240px;
  width: 280px;
  background: #fff;
  border: 1px solid #000;
  border-radius: 4px;
  padding: 15px;
  color: #000;
  z-index: 1000;
  box-shadow: 0 0 10px rgba(178, 255, 255, 0.3);
}

.service-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(27, 27, 27, 0.3);
}

.service-title {
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

.service-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.radius-select {
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
}

/* :deep(.el-radio-button__inner) {
  background: #0b2626;
  border-color: #b2ffff;
  color: #b2ffff;
} */

/* :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background: rgba(178, 255, 255, 0.2);
  border-color: #b2ffff;
  color: #b2ffff;
} */

.service-buttons {
  display: flex;
  gap: 10px;
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

/* :deep(.el-button.active) {
  background: rgba(178, 255, 255, 0.2);
  border-color: #b2ffff;
  color: #b2ffff;
} */

:deep(.el-icon) {
  margin-right: 4px;
}
</style>
