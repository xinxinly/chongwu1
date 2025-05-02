<template>
  <div v-if="visible" class="pet-finder" :class="{ collapsed: isPanelCollapsed }">
    <div class="pet-header">
      <div class="pet-title">宠物寻主</div>
      <div class="header-actions">
        <el-icon class="close-icon" @click="handleClose">
          <Close />
        </el-icon>
      </div>
    </div>
    <div class="pet-content" v-show="!isPanelCollapsed">
      <div class="pet-tabs">
        <el-tabs v-model="activeTab" @tab-change="handleTabChange">
          <el-tab-pane label="宠物丢失登记" name="register" >
            <div class="pet-form">
              <el-form :model="petForm" label-width="80px" label-position="top">
                <el-form-item label="主人姓名" required>
                  <el-input v-model="petForm.ownerName" placeholder="请输入主人姓名"></el-input>
                </el-form-item>
                <el-form-item label="联系电话" required>
                  <el-input v-model="petForm.contactPhone" placeholder="请输入联系电话"></el-input>
                </el-form-item>
                <el-form-item label="宠物特征" required>
                  <el-input 
                    v-model="petForm.petFeatures" 
                    type="textarea" 
                    :rows="3" 
                    placeholder="请输入宠物特征描述（品种、颜色、体型等）"
                  ></el-input>
                </el-form-item>
                <el-form-item label="丢失位置">
                  <div class="location-display">
                    <span class="location-value">{{ locationText }}</span>
                    <el-button 
                      size="small" 
                      type="primary" 
                      :class="{ active: isSelectingLocation }"
                      @click="startSelectLocation"
                    >
                      {{ isSelectingLocation ? '正在选择位置' : '选择位置' }}
                    </el-button>
                  </div>
                </el-form-item>
                <div class="form-actions">
                  <el-button type="primary" @click="submitPetInfo" :disabled="!isFormValid || isSubmitting">
                    <el-icon><Check /></el-icon>
                    {{ isSubmitting ? '提交中...' : '提交信息' }}
                  </el-button>
                  <el-button type="default" @click="resetForm">
                    <el-icon><Refresh /></el-icon>
                    重置表单
                  </el-button>
                </div>
              </el-form>
            </div>
          </el-tab-pane>
          <el-tab-pane label="宠物寻主信息" name="list">
            <div class="pet-list" v-if="activeTab === 'list'">
              <el-empty v-if="!isLoading && petRecords.length === 0" description="暂无记录" />
              <el-skeleton :loading="isLoading" :count="3" v-else-if="isLoading">
                <template #template>
                  <div class="pet-record-skeleton">
                    <el-skeleton-item variant="text" style="width: 30%" />
                    <el-skeleton-item variant="text" style="width: 70%" />
                  </div>
                </template>
              </el-skeleton>
              <div v-else class="pet-records">
                <div v-for="(record, index) in petRecords" :key="index" class="pet-record">
                  <div class="record-header">
                    <span class="record-title">{{ record.username }} </span>
                    <el-button 
                      v-if="record.username === username"
                      type="danger" 
                      link
                      :icon="Delete"
                      @click="handleDelete(record)"
                    />
                  </div>
                  <div class="record-content">
                    <p><span class="label">主人姓名:</span> {{ record.ownerName }}</p>
                    <p><span class="label">联系电话:</span> {{ record.contactPhone }}</p>
                    <p><span class="label">宠物特征:</span> {{ record.petFeatures }}</p>
                    <p><span class="label">位置坐标:</span> {{ record.location.lng }}, {{ record.location.lat }}</p>
                  </div>
                  <div class="record-actions">
                    <el-button type="primary" size="small" @click="locatePetOnMap(record)">
                      <el-icon><Location /></el-icon>
                      在地图上查看
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
            <div class="empty-list" v-else>
              <el-empty description="暂无宠物寻主信息"></el-empty>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, defineProps, defineEmits } from 'vue'
import { Close, Check, Refresh, Location, Delete } from '@element-plus/icons-vue'
import mapboxgl from 'mapbox-gl'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createPetFinder, getPetFinderList, deletePetFinder } from '@/api/petFinder'
import { useUserStore } from '@/stores/user'
import { togglePointsVisibility, removePointsFromMap, addPointsFromMap } from '@/utils/mapPoints'

const emit = defineEmits(['update:visible'])

const visible = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const userStore = useUserStore()
const username = computed(() => userStore.username)

let map = null
const activeTab = ref('register')
const isSelectingLocation = ref(false)
const isSubmitting = ref(false)
const isLoading = ref(false)

const handleTabChange = (e) => {
  if (e === 'list') {
    console.log(e)
  }
}

// 宠物表单
const petForm = ref({
  ownerName: '',
  contactPhone: '',
  petFeatures: '',
  location: null
})

// 宠物记录
const petRecords = ref([])

// 存储标记
const markers = []

// 表单验证
const isFormValid = computed(() => {
  return (
    petForm.value.ownerName && 
    petForm.value.contactPhone && 
    petForm.value.petFeatures && 
    petForm.value.location
  )
})

// 位置文本显示
const locationText = computed(() => {
  if (!petForm.value.location) return '未选择位置'
  
  const { lng, lat } = petForm.value.location
  return `${lng.toFixed(6)}, ${lat.toFixed(6)}`
})

// 开始选择位置
const startSelectLocation = () => {
  isSelectingLocation.value = true
  
  if (map && map.getCanvas()) {
    map.getCanvas().style.cursor = 'crosshair'
  }
  
  // 一次性点击事件
  map.once('click', handleMapClick)
  
  ElMessage.info('请在地图上点击选择宠物丢失位置')
}

// 处理地图点击事件
const handleMapClick = (e) => {
  const lngLat = e.lngLat
  petForm.value.location = {
    lng: parseFloat(lngLat.lng.toFixed(6)),
    lat: parseFloat(lngLat.lat.toFixed(6))
  }
  
  // 预览标记
  addMarkerPreview(lngLat)
  
  isSelectingLocation.value = false
  
  if (map && map.getCanvas()) {
    map.getCanvas().style.cursor = ''
  }
}

// 添加预览标记
const addMarkerPreview = (lngLat) => {
  // 移除之前的预览标记
  removeMarkerPreview()
  
  try {
    // 创建自定义元素
    const el = document.createElement('div')
    el.className = 'pet-marker-preview'
    el.style.backgroundImage = "url('./images/pet-marker.svg')"
    el.style.width = '32px'
    el.style.height = '32px'
    el.style.backgroundSize = 'cover'
    el.style.backgroundRepeat = 'no-repeat'
    
    // 创建标记
    const marker = new mapboxgl.Marker(el)
      .setLngLat(lngLat)
      .addTo(map)
    
    // 存储为预览标记
    markers.push({
      marker,
      isPreview: true
    })
  } catch (error) {
    console.error('添加预览标记时出错:', error)
  }
}

// 移除预览标记
const removeMarkerPreview = () => {
  const previewIndex = markers.findIndex(m => m.isPreview)
  if (previewIndex !== -1) {
    markers[previewIndex].marker.remove()
    markers.splice(previewIndex, 1)
  }
}

// 提交宠物信息
const submitPetInfo = async () => {
  if (!isFormValid.value) {
    ElMessage.warning('请填写完整信息并选择位置')
    return
  }
  
  isSubmitting.value = true
  
  try {
    const submitData = {
      ownerName: petForm.value.ownerName,
      contactPhone: petForm.value.contactPhone,
      petFeatures: petForm.value.petFeatures,
      lng: petForm.value.location.lng,
      lat: petForm.value.location.lat,
      username: username.value
    }
    
    const response = await createPetFinder(submitData)
    if (response.success) {
      const record = {
        id: response.data.id,
        ownerName: submitData.ownerName,
        contactPhone: submitData.contactPhone,
        petFeatures: submitData.petFeatures,
        username: submitData.username,
        location: {
          lng: submitData.lng,
          lat: submitData.lat
        }
      }
      
      petRecords.value.unshift(record)
      
      if (record.location) {
        addPetMarker(record)
      }
      
      resetForm()
      activeTab.value = 'list'
      
      ElMessage.success('宠物寻主信息已发布')
    } else {
      throw new Error(response.message || '发布失败')
    }
  } catch (error) {
    console.error('提交宠物信息时出错:', error)
    ElMessage.error(error.message || '发布失败，请稍后重试')
  } finally {
    isSubmitting.value = false
  }
}

// 添加宠物标记
const addPetMarker = (record) => {
  if (!map || !record.location || !record.location.lng || !record.location.lat) {
    console.warn('无法添加标记：地图未初始化或位置信息不完整')
    return
  }
  
  // 创建标记元素
  const el = document.createElement('div')
  el.className = 'pet-marker'
  el.style.backgroundImage = "url('/images/pet-marker.svg')"
  el.style.width = '32px'
  el.style.height = '32px'
  el.style.backgroundSize = 'cover'
  el.style.backgroundRepeat = 'no-repeat'
  el.style.cursor = 'pointer'
  
  // 创建新标记
  const marker = new mapboxgl.Marker(el)
    .setLngLat([parseFloat(record.location.lng), parseFloat(record.location.lat)])
    .setPopup(
      new mapboxgl.Popup({ offset: 25, closeButton: false })
        .setHTML(
          `<div class="popup-content">
            <div class="popup-header">
              <h3 class="popup-title">${record.ownerName}的宠物</h3>
            </div>
            <div class="popup-body">
              <div class="info-item">
                <span class="info-label">宠物特征：</span>
                <span class="info-value">${record.petFeatures}</span>
              </div>
              <div class="info-item">
                <span class="info-label">联系电话：</span>
                <span class="info-value">${record.contactPhone}</span>
              </div>
            </div>
          </div>`
        )
    )
    .addTo(map)

  // 保存标记引用
  markers.push({
    marker,
    petInfo: record,
    isPreview: false
  })
}

// 删除宠物记录
const handleDelete = async (record) => {
  // 检查是否是当前用户的记录
  if (record.username !== username.value) {
    ElMessage.warning('只能删除自己发布的信息')
    return
  }

  try {
    await ElMessageBox.confirm('确定要删除这条记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      customClass: 'custom-message-box',
      confirmButtonClass: 'custom-confirm-button',
      cancelButtonClass: 'custom-cancel-button'
    })
    
    const response = await deletePetFinder(record.id, record.username)
    if (response.success) {
      petRecords.value = petRecords.value.filter(item => item.id !== record.id)
      removePetMarker(record)
      ElMessage.success('删除成功')
    } else {
      throw new Error(response.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除记录时出错:', error)
      ElMessage.error(error.message || '删除失败，请稍后重试')
    }
  }
}

// 在地图上定位宠物
const locatePetOnMap = (record) => {
  map.flyTo({
    center: [record.location.lng, record.location.lat],
    zoom: 15,
    essential: true
  })
  
  // 查找并打开对应的标记弹窗
  const markerObj = markers.find(
    m => !m.isPreview && 
    m.petInfo && 
    m.petInfo.location.lng === record.location.lng &&
    m.petInfo.location.lat === record.location.lat
  )
  
  if (markerObj) {
    setTimeout(() => {
      markerObj.marker.togglePopup()
    }, 1000)
  }
}

// 重置表单
const resetForm = () => {
  petForm.value = {
    ownerName: '',
    contactPhone: '',
    petFeatures: '',
    location: null
  }
  
  // 移除预览标记
  removeMarkerPreview()
}

// 关闭面板
const handleClose = () => {
  try {
    // 清理状态
    isSelectingLocation.value = false
    
    if (map && map.getCanvas()) {
      map.getCanvas().style.cursor = ''
    }
    
    // 移除预览标记
    removeMarkerPreview()
  } catch (error) {
    console.error('关闭面板时出错:', error)
  }
  
  emit('update:visible', false)
}

const fetchPetRecords = async () => {
  isLoading.value = true
  try {
    const response = await getPetFinderList()
    if (response.success) {
      // 转换数据格式，确保每条记录都有正确的 location 对象
      petRecords.value = response.data.map(record => ({
        id: record.id,
        ownerName: record.ownerName,
        contactPhone: record.contactPhone,
        petFeatures: record.petFeatures,
        username: record.username,
        location: {
          lng: record.lng,
          lat: record.lat
        }
      }))
      // 更新地图标记
      petRecords.value.forEach(record => {
        if (record.location && record.location.lng && record.location.lat) {
          addPetMarker(record)
        }
      })
    } else {
      throw new Error(response.message || '获取列表失败')
    }
  } catch (error) {
    console.error('获取宠物寻主列表失败:', error)
    ElMessage.error(error.message || '获取列表失败，请稍后重试')
  } finally {
    isLoading.value = false
  }
}

// 在组件挂载时获取列表
onMounted(() => {
  try {
    // 每次挂载时重新获取map对象
    map = window.map
    if (!map) {
      console.warn('无法获取地图对象 map')
    }
    fetchPetRecords()
    togglePointsVisibility(map, 'business', false) 
    togglePointsVisibility(map, 'park', false)
    togglePointsVisibility(map, 'hospital', false)
    removePointsFromMap(map)
  } catch (error) {
    console.error('组件挂载时出错:', error)
  }
})

// 移除单个宠物标记
const removePetMarker = (record) => {
  if (!record || !record.location) {
    console.warn('无效的记录，无法移除标记')
    return
  }

  try {
    // 查找匹配的标记
    const markerIndex = markers.findIndex(
      m => !m.isPreview && 
      m.petInfo && 
      m.petInfo.id === record.id
    )
    
    if (markerIndex !== -1) {
      // 如果标记有弹窗，先关闭弹窗
      if (markers[markerIndex].marker.getPopup()) {
        markers[markerIndex].marker.getPopup().remove()
      }
      // 移除标记
      markers[markerIndex].marker.remove()
      // 从数组中移除
      markers.splice(markerIndex, 1)
    }
  } catch (error) {
    console.error('移除宠物标记时出错:', error)
  }
}

// 移除所有宠物标记
const removeAllPetMarkers = () => {
  try {
    // 移除所有非预览标记
    markers.forEach(markerObj => {
      if (!markerObj.isPreview) {
        // 如果标记有弹窗，先关闭弹窗
        if (markerObj.marker.getPopup()) {
          markerObj.marker.getPopup().remove()
        }
        markerObj.marker.remove()
      }
    })
    
    // 只保留预览标记
    const previewMarkers = markers.filter(m => m.isPreview)
    markers.length = 0
    markers.push(...previewMarkers)
  } catch (error) {
    console.error('移除所有宠物标记时出错:', error)
  }
}

// 在组件卸载时清理所有标记
onUnmounted(() => {
  try {
    // 清除所有事件
    if (map) {
      map.off('click', handleMapClick)
      
      if (map.getCanvas()) {
        map.getCanvas().style.cursor = ''
      }
    }
    // 清除所有标记
    removeAllPetMarkers()
    togglePointsVisibility(map, 'business', true) 
    togglePointsVisibility(map, 'park', true)
    togglePointsVisibility(map, 'hospital', true)
    addPointsFromMap(map)
  } catch (error) {
    console.error('组件卸载时清理资源出错:', error)
  }
})
</script>

<style scoped>
.pet-finder {
  position: fixed;
  top: 12%;
  right: 240px;
  width: 400px;
  height: 900px;
  background: #fff;
  border: 1px solid #000;
  border-radius: 4px;
  padding: 15px;
  color: #000;
  z-index: 1000;
  box-shadow: 0 0 10px rgba(178, 255, 255, 0.3);
  max-height: 75vh;
  overflow-y: hidden;
  transform: translateY(0);
  transition: transform 0.3s ease;
  scrollbar-width: thin;
  /* scrollbar-color: rgba(178, 255, 255, 0.5) rgba(11, 38, 38, 0.3); */
}

.pet-finder.collapsed {
  transform: translateY(calc(-100% + 40px));
}

.pet-finder::-webkit-scrollbar {
  width: 6px;
}

/* .pet-finder::-webkit-scrollbar-track {
  background: rgba(11, 38, 38, 0.3);
  border-radius: 3px;
} */

/* .pet-finder::-webkit-scrollbar-thumb {
  background-color: rgba(178, 255, 255, 0.5);
  border-radius: 3px;
  border: 1px solid rgba(178, 255, 255, 0.2);
} */

/* .pet-finder::-webkit-scrollbar-thumb:hover {
  background-color: rgba(178, 255, 255, 0.7);
} */

.pet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid rgba(27, 27, 27, 1);
}

.pet-title {
  font-size: 16px;
  color: #000;
  font-family: 'YouSheBiaoTiHei', sans-serif;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.toggle-button {
  color: #000;
  cursor: pointer;
  transition: all 0.3s;
  transform: rotate(0deg);
}

.toggle-button.collapsed {
  transform: rotate(180deg);
}

.toggle-button:hover {
  transform: scale(1.1) rotate(0deg);
}

.toggle-button.collapsed:hover {
  transform: scale(1.1) rotate(180deg);
}

.close-icon {
  color: #000;
  cursor: pointer;
  transition: all 0.3s;
}

.close-icon:hover {
  transform: scale(1.1);
}

.pet-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* :deep(.el-tabs__item) {
  color: rgba(178, 255, 255, 0.7);
  font-size: 14px;
} */

/* :deep(.el-tabs__item.is-active) {
  color: #b2ffff;
} */

/* :deep(.el-tabs__active-bar) {
  background-color: #b2ffff;
} */

:deep(.el-tabs__nav-wrap::after) {
  background-color: rgba(178, 255, 255, 0.1);
}

:deep(.el-form-item__label) {
  color: #000;
  font-size: 14px;
}

:deep(.el-input__wrapper) {
  /* background-color: rgba(178, 255, 255, 0.05); */
  /* box-shadow: 0 0 0 1px rgba(178, 255, 255, 0.3) inset !important; */
  border-radius: 4px;
  transition: all 0.3s ease;
  padding: 0 11px;
}

/* :deep(.el-input__wrapper.is-focus) {
  background-color: rgba(178, 255, 255, 0.1);
  box-shadow: 0 0 0 1px #b2ffff inset !important;
} */

:deep(.el-textarea__wrapper) {
  /* background-color: rgba(178, 255, 255, 0.05); */
  box-shadow: 0 0 0 1px rgba(178, 255, 255, 0.3) inset !important;
  border-radius: 4px;
  transition: all 0.3s ease;
  padding: 5px 11px;
}

:deep(.el-textarea__wrapper.is-focus) {
  /* background-color: rgba(178, 255, 255, 0.1); */
  box-shadow: 0 0 0 1px #b2ffff inset !important;
}

/* :deep(.el-input__inner) {
  background: rgba(178, 255, 255, 0.05);
  border-color: rgba(178, 255, 255, 0.3);
  color: #fff;
} */

:deep(.el-textarea__inner) {
  background: rgba(178, 255, 255, 0.05);
  border-color: rgba(178, 255, 255, 0.3);
  color: #000;
}

/* :deep(.el-button) {
  background: #0b2626;
  border-color: #b2ffff;
  color: #b2ffff;
} */

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
/* 
:deep(.el-button.el-button--primary:not(:disabled)) {
  background: #0b2626;
}

:deep(.el-button.el-button--primary:hover:not(:disabled)) {
  background: rgba(178, 255, 255, 0.1);
}

:deep(.el-button.el-button--danger:not(:disabled)) {
  background: #0b2626;
  border-color: #ff6b6b;
  color: #ff6b6b;
}

:deep(.el-button.el-button--danger:hover:not(:disabled)) {
  background: rgba(255, 107, 107, 0.1);
}
:deep(.el-input__wrapper) {
  background-color: rgba(178, 255, 255, 0.1);
} */

:deep(.el-input__inner) {
  color: #000;
  background: transparent;
}
/* :deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.5);
} */

.location-display {
  display: flex;
  align-items: center;
  gap: 10px;
}

.location-value {
  flex: 1;
  font-family: monospace;
  padding: 4px 8px;
  background: rgba(27,27,27, 0.1);
  border-radius: 3px;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.pet-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-height: 400px;
  overflow-y: auto;
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}

.pet-list::-webkit-scrollbar {
  display: none;  /* Chrome, Safari and Opera */
}

.pet-record {
  background: rgba(27,27,27, 0.05);
  border: 1px solid #000;
  border-radius: 4px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(178, 255, 255, 0.1);
  padding-bottom: 8px;
}

.record-title {
  font-size: 16px;
  color: #000;
  font-weight: bold;
}

.record-content {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 14px;
}

.record-content .label {
  color: #000;
  margin-right: 5px;
  font-weight: bold;
}

.record-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 5px;
}

.empty-list {
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(178, 255, 255, 0.5) rgba(11, 38, 38, 0.3);
}

:deep(.el-empty__description) {
  color: rgba(178, 255, 255, 0.7);
}

:deep(.el-icon) {
  margin-right: 4px;
}

/* 宠物标记样式 */
:global(.pet-marker) {
  background-color: transparent;
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  box-shadow: 0 0 10px rgba(178, 255, 255, 0.5);
}

:global(.pet-marker-preview) {
  background-color: transparent;
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  box-shadow: 0 0 15px rgba(178, 255, 255, 0.8);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 10px rgba(178, 255, 255, 0.5);
  }
  50% {
    transform: scale(1.1);
    box-shadow: 0 0 20px rgba(178, 255, 255, 0.8);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 10px rgba(178, 255, 255, 0.5);
  }
}

/* 自定义弹窗样式 */
:global(.mapboxgl-popup) {
  max-width: 350px !important;
}

/* :global(.mapboxgl-popup-content) {
  background: #0b2626 !important;
  border: 1px solid #b2ffff !important;
  border-radius: 4px !important;
  padding: 0 !important;
  box-shadow: 0 0 10px rgba(178, 255, 255, 0.3) !important;
} */

:global(.popup-content) {
  color: #000;
}

:global(.popup-header) {
  padding: 12px 15px;
  border-bottom: 1px solid rgba(178, 255, 255, 0.2);
}

:global(.popup-title) {
  margin: 0;
  font-size: 16px;
  color: #000;
  font-weight: bold;
}

:global(.popup-body) {
  padding: 12px 15px;
}

:global(.info-item) {
  margin-bottom: 8px;
  display: flex;
  align-items: flex-start;
}

:global(.info-item:last-child) {
  margin-bottom: 0;
}

:global(.info-label) {
  color: #000;
  font-weight: bold;
  margin-right: 8px;
  white-space: nowrap;
}

:global(.info-value) {
  color: #000;
  flex: 1;
}

:global(.mapboxgl-popup-close-button) {
  padding: 0 6px;
  color: #b2ffff;
  font-size: 20px;
  font-weight: normal;
  background: transparent;
  border: none;
  outline: none;
  right: 5px;
  top: 8px;
}

:global(.mapboxgl-popup-close-button:hover) {
  color: #fff;
  background: transparent;
}

:global(.mapboxgl-popup-tip) {
  border-top-color: #b2ffff !important;
  border-bottom-color: #b2ffff !important;
}

.pet-record-skeleton {
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.pet-record-skeleton .el-skeleton-item {
  margin: 8px 0;
}

:deep(.el-button.el-button--danger.is-link) {
  border: none;
  padding: 0;
  height: auto;
  color: #ff6b6b;
}

:deep(.el-button.el-button--danger.is-link:hover) {
  color: #ff8f8f;
  background: transparent;
}
</style>
