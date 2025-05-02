<template>
  <div v-if="visible" class="measure-control">
    <div class="measure-header">
      <div class="measure-title">距离测量</div>
      <el-icon class="close-icon" @click="handleClose">
        <Close />
      </el-icon>
    </div>
    <div class="measure-content">
      <div class="distance-display">
        <span class="label">测量距离：</span>
        <span class="value">{{ formatDistance }}</span>
      </div>
      <div class="measure-buttons">
        <el-button 
          type="primary" 
          :class="{ active: measuring }"
          @click="toggleMeasure"
        >
          <el-icon><Crop /></el-icon>
          {{ measuring ? '正在测量' : '开始测量' }}
        </el-button>
        <el-button 
          type="danger" 
          @click="clearMeasurement"
        >
          <el-icon><Delete /></el-icon>
          清除测量
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, defineProps, defineEmits, watch } from 'vue'
import { Close, Crop, Delete } from '@element-plus/icons-vue'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import * as turf from '@turf/turf'

const props = defineProps({
  visible: Boolean,
  map: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:visible'])

const measuring = ref(false)
const distance = ref(0)
let draw = null

// 格式化距离显示
const formatDistance = computed(() => {
  if (distance.value < 1000) {
    return `${distance.value.toFixed(2)} 米`
  } else {
    return `${(distance.value / 1000).toFixed(2)} 公里`
  }
})

// 初始化绘图工具
const initDraw = () => {
  // 如果已经存在 draw 实例，先移除它
  if (draw) {
    props.map.removeControl(draw)
  }

  try {
    draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        line_string: true,
        trash: false
      },
      styles: [
        // 线条样式
        {
          id: 'gl-draw-line',
          type: 'line',
          filter: ['all', ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
          layout: {
            'line-cap': 'round',
            'line-join': 'round'
          },
          paint: {
            'line-color': 'black',
            'line-dasharray': [2, 2],
            'line-width': 4
          }
        },
        // 节点样式
        {
          id: 'gl-draw-point',
          type: 'circle',
          filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'vertex']],
          paint: {
            'circle-radius': 6,
            'circle-color': 'blue'
          }
        }
      ]
    })

    props.map.addControl(draw)

    // 监听绘制事件
    props.map.on('draw.create', updateDistance)
    props.map.on('draw.update', updateDistance)
    props.map.on('draw.delete', updateDistance)

    return true
  } catch (error) {
    console.error('初始化绘图工具失败:', error)
    return false
  }
}

// 计算距离
const updateDistance = (e) => {
  const data = draw.getAll()
  if (data.features.length > 0) {
    const line = data.features[0]
    const length = turf.length(line, { units: 'meters' })
    distance.value = length
  } else {
    distance.value = 0
  }
}

// 开始/停止测量
const toggleMeasure = () => {
  if (!draw) {
    // 如果 draw 不存在，尝试初始化
    if (!initDraw()) {
      console.error('无法初始化绘图工具')
      return
    }
  }

  measuring.value = !measuring.value
  try {
    if (measuring.value) {
      draw.changeMode('draw_line_string')
    } else {
      draw.changeMode('simple_select')
    }
  } catch (error) {
    console.error('切换测量模式失败:', error)
    measuring.value = false
  }
}

// 清除测量
const clearMeasurement = () => {
  if (!draw) return

  try {
    draw.deleteAll()
    distance.value = 0
    measuring.value = false
  } catch (error) {
    console.error('清除测量失败:', error)
  }
}

// 关闭面板
const handleClose = () => {
  clearMeasurement()
  emit('update:visible', false)
}

// 监听 visible 变化
watch(() => props.visible, (newVal) => {
  if (newVal && !draw) {
    // 当面板显示时，如果 draw 不存在则初始化
    initDraw()
  }
})

onMounted(() => {
  if (props.map && props.visible) {
    initDraw()
  }
})

onUnmounted(() => {
  if (props.map && draw) {
    props.map.off('draw.create', updateDistance)
    props.map.off('draw.update', updateDistance)
    props.map.off('draw.delete', updateDistance)
    props.map.removeControl(draw)
    draw = null
  }
})
</script>

<style scoped>
.measure-control {
  position: fixed;
  top: 12%;
  right: 240px;
  width: 280px;
  background: #fff;
  border: 1px solid #1B1B1B;
  border-radius: 4px;
  padding: 15px;
  color: #fff;
  z-index: 1000;
  box-shadow: 0 0 10px rgba(178, 255, 255, 0.3);
}

.measure-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(27,27,27, 1);
}

.measure-title {
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

.measure-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.distance-display {
  background: rgba(27,27,27, 0.1);
  padding: 10px;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  color: #000;
  font-size: 14px;
}

.value {
  font-size: 16px;
  font-weight: bold;
  color: #000;
}

.measure-buttons {
  display: flex;
  gap: 10px;
}

:deep(.el-button) {
  flex: 1;
  /* background: #0b2626;
  border-color: #b2ffff;
  color: #b2ffff; */
}

:deep(.el-button.active) {
  background: rgba(178, 255, 255, 0.2);
  border-color: #b2ffff;
  color: #b2ffff;
}

:deep(.el-icon) {
  margin-right: 4px;
}
/* 隐藏 MapboxDraw 自带的控件 */
:deep(.mapbox-gl-draw_ctrl-draw-btn) {
  display: none !important;
}
:deep(.mapboxgl-ctrl-group) {
  display: none !important;
}
</style>
