<template>
  <div class="main-container">
    <!-- 地图容器 -->
    <div id="map" class="map-container"></div>
    
    <!-- 顶部标题栏 -->
    <div class="header">
      <div class="time-display">{{ currentTime }}</div>
      <div class="title">宠物友好型城市服务平台</div>
      <div class="user-info">
        <div class="user-profile">
          <el-avatar
            :size="40"
            :src="userAvatar"
            class="user-avatar"
          />
          <div class="user-details" @click="handleUserDetailsClick">
            <span class="username">{{ username.username }}</span>
            <span class="user-role" :class="{ 'admin-role': isAdmin }">
              {{ isAdmin ? '（管理员）' : '（普通用户）' }}
            </span>
          </div>
        </div>
        <el-icon 
          class="logout-icon" 
          @click="confirmLogout"
        >
          <SwitchButton />
        </el-icon>
      </div>
    </div>
    
    <!-- 底部导航 -->
    <div class="bottom-nav">
      <div class="nav-items">
        <div class="nav-item" :class="{ active: activeNav === 'measure' }" @click="handleMeasureClick">
          <div class="nav-text">地图量算</div>
        </div>
        <div class="nav-item" :class="{ active: activeNav === 'plane' }" @click="handleRouteClick">
          <div class="nav-text">路径规划</div>
        </div>
        <div class="nav-item" :class="{ active: activeNav === 'service' }" @click="handleServiceQueryClick">
          <div class="nav-text">服务查询</div>
        </div>
        <div class="nav-item" :class="{ active: activeNav === 'pet' }" @click="handlePetClick">
          <div class="nav-text">宠物寻主</div>
        </div>
        <div class="nav-item" :class="{ active: activeNav === 'knowledge' }" @click="showKnowledgePopup">
          <div class="nav-text">知识科普</div>
        </div>
      </div>
    </div>
    
    <!-- 知识科普弹出框 -->
    <KnowledgePopup v-model="isKnowledgePopupVisible" />
    <LayerControl :map="map" />
    <SearchBox :map="map" />
    <div id="mini-map" class="mini-map"></div>
    <MeasureControl 
      v-model:visible="isMeasureVisible" 
      :map="map" 
    />
    <ServiceQuery 
      v-if="isServiceQueryVisible"
      v-model:visible="isServiceQueryVisible" 
    />
    <RouteControl
      v-if="isRouteControlVisible"
      v-model:visible="isRouteControlVisible"
    />
    <PetFinder
      v-if="isPetFinderVisible"
      v-model:visible="isPetFinderVisible"
    />
    <DataManagement
      v-model:visible="isDataManagementVisible"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { SwitchButton } from '@element-plus/icons-vue'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import userAvatar from '../assets/images/user-avatar.jpg'
import KnowledgePopup from '../components/KnowledgePopup.vue'
import { addAdministrativeRegion } from '@/utils/mapUtils'
import jinanData from '@/assets/jinan.json'
import { addPointsToMap, addHeatmapLayer } from '@/utils/mapPoints'
import LayerControl from '@/components/LayerControl.vue'
import SearchBox from '@/components/SearchBox.vue'
import MeasureControl from '@/components/MeasureControl.vue'
import ServiceQuery from '@/components/ServiceQuery.vue'
import RouteControl from '@/components/RouteControl.vue'
import PetFinder from '@/components/PetFinder.vue'
import DataManagement from '@/components/data-management/DataManagement.vue'

const router = useRouter()
const username = ref('')
const currentTime = ref('')
const map = ref(null)
let timer = null
const activeNav = ref('')
const isKnowledgePopupVisible = ref(false)
const isMeasureVisible = ref(false)
const isServiceQueryVisible = ref(false)
const isRouteControlVisible = ref(false)
const isPetFinderVisible = ref(false)
const isDataManagementVisible = ref(false)

// 判断是否为管理员
const isAdmin = computed(() => username.value.user_role === 'admin')

// 更新时间
const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

// 确认退出
const confirmLogout = () => {
  ElMessageBox.confirm(
    '确定要退出平台吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      customClass: 'custom-message-box',
      confirmButtonClass: 'custom-confirm-button',
      cancelButtonClass: 'custom-cancel-button'
    }
  ).then(() => {
    handleLogout()
  }).catch(() => {})
}

// 退出登录
const handleLogout = () => {
  localStorage.removeItem('isLoggedIn')
  localStorage.removeItem('username')
  router.push('/login')
}

// 初始化地图
const initMap = () => {
  mapboxgl.accessToken = 'pk.eyJ1IjoibGdkbWFwZ2wiLCJhIjoiY2x5NzJsMHluMDFudTJpcXpjbXp0czc0ZSJ9.52b07aY6R6LqkwveJFKr2w'
  
  map.value = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-zh-v1',
    center: [117.100923, 36.705807],
    zoom: 10
  })

  // 将map对象设置为全局变量
  window.map = map.value
  map.value.on('load', async () => {
    await addPointsToMap(map.value)
    addHeatmapLayer(map.value)
    addAdministrativeRegion(map.value, jinanData)
    addMiniMap(map.value)
  })

  // 监听缩放事件
  map.value.on('zoom', () => {
    const zoom = map.value.getZoom()
    // 当缩放级别大于14时隐藏标签
    if (zoom > 14) {
      map.value.setLayoutProperty('administrative-region-labels', 'visibility', 'none')
    } else {
      map.value.setLayoutProperty('administrative-region-labels', 'visibility', 'visible')
    }
  })

  // 添加导航控件
  map.value.addControl(new mapboxgl.NavigationControl(), 'top-left')
  
  // 添加比例尺
  map.value.addControl(new mapboxgl.ScaleControl(), 'bottom-left')
  
  // 添加全屏控件
  map.value.addControl(new mapboxgl.FullscreenControl(), 'top-left')
}

// 处理窗口大小变化
const handleResize = () => {
  if (map.value) {
    map.value.resize()
  }
}

// 显示知识科普弹窗
const showKnowledgePopup = () => {
  // 关闭其他功能
  isMeasureVisible.value = false
  isServiceQueryVisible.value = false
  isRouteControlVisible.value = false
  isPetFinderVisible.value = false
  
  // 切换导航状态
  activeNav.value = 'knowledge'
  isKnowledgePopupVisible.value = true
}

// 在地图初始化完成后添加鹰眼图
const addMiniMap = (mainMap) => {
  const miniMap = new mapboxgl.Map({
    container: 'mini-map',
    style: 'mapbox://styles/mapbox/streets-zh-v1',
    center: mainMap.getCenter(),
    zoom: mainMap.getZoom() - 4,
    interactive: false 
  })

  mainMap.on('move', () => {
    miniMap.setCenter(mainMap.getCenter())
  })

  mainMap.on('zoom', () => {
    miniMap.setZoom(mainMap.getZoom() - 4)
  })

  const bounds = mainMap.getBounds()
  const coordinates = [
    [bounds.getNorthEast().lng, bounds.getNorthEast().lat],
    [bounds.getNorthWest().lng, bounds.getNorthWest().lat],
    [bounds.getSouthWest().lng, bounds.getSouthWest().lat],
    [bounds.getSouthEast().lng, bounds.getSouthEast().lat],
    [bounds.getNorthEast().lng, bounds.getNorthEast().lat]
  ]

  miniMap.on('load', () => {
    miniMap.addSource('bounds', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: coordinates
        }
      }
    })

    miniMap.addLayer({
      id: 'bounds',
      type: 'line',
      source: 'bounds',
      layout: {},
      paint: {
        'line-color': 'red',
        'line-width': 2
      }
    })
  })
}

// 修改地图量算按钮的点击事件
const handleMeasureClick = () => {
  // 关闭其他功能
  isServiceQueryVisible.value = false
  isKnowledgePopupVisible.value = false
  isRouteControlVisible.value = false
  isPetFinderVisible.value = false
  
  // 切换导航状态
  activeNav.value = 'measure'
  isMeasureVisible.value = true
}

// 修改服务查询按钮的点击事件
const handleServiceQueryClick = () => {
  // 关闭其他功能
  isMeasureVisible.value = false
  isKnowledgePopupVisible.value = false
  isRouteControlVisible.value = false
  isPetFinderVisible.value = false
  
  // 切换导航状态
  activeNav.value = 'service'
  isServiceQueryVisible.value = true
}

// 处理路径规划按钮的点击事件
const handleRouteClick = () => {
  // 关闭其他功能
  isMeasureVisible.value = false
  isServiceQueryVisible.value = false
  isKnowledgePopupVisible.value = false
  isPetFinderVisible.value = false
  
  // 切换导航状态
  activeNav.value = 'plane'
  isRouteControlVisible.value = true
}

// 添加宠物寻主按钮的点击事件
const handlePetClick = () => {
  // 关闭其他功能
  isMeasureVisible.value = false
  isServiceQueryVisible.value = false
  isKnowledgePopupVisible.value = false
  isRouteControlVisible.value = false
  
  // 切换导航状态
  activeNav.value = 'pet'
  isPetFinderVisible.value = true
}

// 添加用户详情点击处理方法
const handleUserDetailsClick = () => {
  if (JSON.parse(localStorage.getItem('username')).user_role !== 'admin') {
    ElMessage.warning('只有管理员可以访问数据管理')
    return
  }
  isDataManagementVisible.value = true
}

onMounted(() => {
  username.value = JSON.parse(localStorage.getItem('username'))
  updateTime()
  timer = setInterval(updateTime, 1000)
  initMap()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
  if (map.value) {
    map.value.remove()
  }
  window.removeEventListener('resize', handleResize)
})
</script>

<style>
.mapboxgl-ctrl-top-left {
  top: 80px !important;
}

/* 导航控件样式 */
/* .mapboxgl-ctrl-group {
  background-color: #0b2626 !important;
  border: 1px solid #b2ffff !important;
  box-shadow: 0 0 10px rgba(178, 255, 255, 0.3) !important;
  border-radius: 4px !important;
  margin: 10px !important;
} */

/* .mapboxgl-ctrl-group button {
  background-color: transparent !important;
  border-color: #b2ffff !important;
  color: #b2ffff !important;
  width: 30px !important;
  height: 30px !important;
} */

.mapboxgl-ctrl-group button:hover {
  background-color: rgba(178, 255, 255, 0.1) !important;
}

.mapboxgl-ctrl-group button:active {
  background-color: rgba(178, 255, 255, 0.2) !important;
}

.mapboxgl-ctrl-group button:disabled {
  color: rgba(178, 255, 255, 0.3) !important;
  border-color: rgba(178, 255, 255, 0.3) !important;
}

/* .mapboxgl-ctrl button.mapboxgl-ctrl-zoom-in .mapboxgl-ctrl-icon {
  background: url('../assets/images/zoom-in.png');
  background-repeat: no-repeat;
  background-size: 80% 80%;
  background-position: center; 
} */
/* .mapboxgl-ctrl button.mapboxgl-ctrl-zoom-out .mapboxgl-ctrl-icon {
  background: url('../assets/images/zoom-out.png');
  background-repeat: no-repeat;
  background-size: 80% 100%;
  background-position: center; 
} */
/* .mapboxgl-ctrl button.mapboxgl-ctrl-compass .mapboxgl-ctrl-icon {
  background: url('../assets/images/compass.png');
  background-repeat: no-repeat;
  background-size: 60% 65%;
  background-position: center; 
} */
/* .mapboxgl-ctrl button.mapboxgl-ctrl-fullscreen .mapboxgl-ctrl-icon {
  background: url('../assets/images/fullscreen.png');
  background-repeat: no-repeat;
  background-size: 90% 90%;
  background-position: center; 
} */
/* .mapboxgl-ctrl button.mapboxgl-ctrl-shrink .mapboxgl-ctrl-icon {
  background: url('../assets/images/shrink.png');
  background-repeat: no-repeat;
  background-size: 90% 90%;
  background-position: center; 
} */

/* 全屏控件样式 */
/* .mapboxgl-ctrl-fullscreen {
  background-color: #0b2626 !important;
  border: 1px solid #b2ffff !important;
  box-shadow: 0 0 10px rgba(178, 255, 255, 0.3) !important;
  border-radius: 4px !important;
} */

/* .mapboxgl-ctrl-fullscreen button {
  background-color: transparent !important;
  border-color: #b2ffff !important;
  color: #b2ffff !important;
} */

/* .mapboxgl-ctrl-fullscreen button:hover {
  background-color: rgba(178, 255, 255, 0.1) !important;
} */

/* .mapboxgl-ctrl-fullscreen button:active {
  background-color: rgba(178, 255, 255, 0.2) !important;
} */

/* 比例尺样式 */
/* .mapboxgl-ctrl-scale {
  background-color: #0b2626 !important;
  border: 1px solid #b2ffff !important;
  box-shadow: 0 0 10px rgba(178, 255, 255, 0.3) !important;
  color: #b2ffff !important;
  font-size: 12px !important;
  padding: 2px 5px !important;
  border-radius: 4px !important;
  margin: 10px !important;
} */

.mapboxgl-ctrl-scale-inner {
  border: none !important;
}
</style>

<style scoped>
.main-container {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
}

.map-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

/* 底部导航 */
.bottom-nav {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  width: 950px;
}

.nav-items {
  /* background-image: url('../assets/images/bottom.png');
  background-size: 100% 100%;
  background-repeat: no-repeat; */
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 30px;
  height: 50px;
}

.nav-item {
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
}

.nav-item:hover {
  transform: translateY(-5px);
}

.nav-icon {
  position: relative;
  left: -2px;
  z-index: 2;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-text {
  background-color: #0b2626;
  padding: 8px;
  color: #fff;
  font-size: 18px;
  text-shadow: 0 0 10px rgba(178, 255, 255, 0.5);
  z-index: 3;
  position: relative;
  bottom: 40px;
  left: -2px;
  font-family: 'YouSheBiaoTiHei', sans-serif;
}

.nav-item.active .nav-text {
  color: #b2ffff;
  background-color: #0b2626;
  
}

.nav-base {
  position: absolute;
  bottom: 50px;
  width: 80px;
  height: 40px;
  /* background-image: url('../assets/images/base.png');
  background-size: 100% 100%;
  background-repeat: no-repeat; */
  z-index: 1;
}

.header {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 60px;
  background-color: #1E3C72;
  /* background-image: url('../assets/images/header.png'); */
  /* background-size: 100% 100%; */
  /* background-repeat: no-repeat; */
  z-index: 2;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.time-display {
  position: absolute;
  top: 26%;
  left: 20px;
  /* font-family: 'YouSheBiaoTiHei', sans-serif; */
  font-size: 1.2rem;
  color: #b2ffff;
  min-width: 200px;
}

.title {
  position: absolute;
  top: 10%;
  left: 0;
  width: 100%;
  line-height: 43px;
  text-align: center;
  font-size: 2.2rem;
  color: #ffff;
  /* font-family: 'YouSheBiaoTiHei', sans-serif; */
  /* background: linear-gradient(180deg, #fff, #b2ffff); */
  /* background-clip: text; */
  /* -webkit-text-fill-color: transparent; */
}

.user-info {
  position: absolute;
  top: 16%;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 2px;
  min-width: 200px;
  justify-content: flex-end;
  cursor: pointer;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar {
  border: 0.5px solid #b2ffff;
  box-shadow: 0 0 10px rgba(178, 255, 255, 0.3);
}

.user-details {
  display: flex;
  gap: 2px;
}

.username {
  color: #ffff;
  font-size: 14px;
  line-height: 1.2;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

.user-role {
  font-size: 12px;
  color: #ffff;
  opacity: 0.8;
}

.admin-role {
  color: #ffff;
}

.logout-icon {
  color: #b2ffff;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.logout-icon:hover {
  color: #ff6b6b;
  transform: scale(1.1);
}

/* 响应式调整 */
@media screen and (max-width: 768px) {
  .header {
    height: 50px;
    padding: 0 10px;
  }

  .time-display {
    font-size: 1rem;
    min-width: 150px;
  }

  .title {
    font-size: 1.4rem;
  }

  .user-info {
    min-width: 150px;
    gap: 8px;
  }

  .username {
    font-size: 12px;
  }

  .user-role {
    font-size: 10px;
  }

  .logout-icon {
    font-size: 18px;
  }
  
  /* 底部导航响应式 */
  .bottom-nav {
    width: 600px;
  }
  
  .nav-items {
    gap: 60px;
    height: 80px;
    padding-top: 30px;
  }
  
  .nav-icon {
    width: 30px;
    height: 30px;
  }
  
  .nav-text {
    font-size: 12px;
    margin-top: 8px;
  }
  
  .nav-base {
    width: 50px;
    height: 25px;
    bottom: -12px;
  }
}

@media screen and (max-width: 480px) {
  .header {
    height: 40px;
    padding: 0 5px;
  }

  .time-display {
    font-size: 0.9rem;
    min-width: 120px;
  }

  .title {
    font-size: 1.2rem;
  }

  .user-info {
    min-width: 120px;
    gap: 4px;
  }

  .user-avatar {
    width: 24px;
    height: 24px;
  }

  .username {
    font-size: 11px;
  }

  .user-role {
    font-size: 9px;
  }

  .logout-icon {
    font-size: 16px;
  }
  
  /* 底部导航响应式 */
  .bottom-nav {
    width: 400px;
    bottom: 10px;
  }
  
  .nav-items {
    gap: 40px;
    height: 60px;
    padding-top: 20px;
  }
  
  .nav-icon {
    width: 20px;
    height: 20px;
  }
  
  .nav-text {
    font-size: 10px;
    margin-top: 5px;
  }
  
  .nav-base {
    width: 40px;
    height: 20px;
    bottom: -10px;
  }
}

/* 确保地图控件在移动设备上也能正常显示 */
:deep(.mapboxgl-ctrl-group) {
  margin: 10px !important;
}

:deep(.mapboxgl-ctrl-scale) {
  margin: 10px !important;
}

.mini-map {
  position: fixed;
  bottom: 40px;
  right: 20px;
  width: 150px;
  height: 150px;
  border: 1px solid #000;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 0 10px rgba(178, 255, 255, 0.3);
  z-index: 1000;
}

/* 可选：添加鹰眼图的标题 */
.mini-map::before {
  content: '鹰眼图';
  position: absolute;
  top: 5px;
  left: 50%;
  transform: translateX(-50%);
  color: #000;
  font-size: 12px;
  z-index: 1;
  font-family: 'YouSheBiaoTiHei', sans-serif;
}
</style>
