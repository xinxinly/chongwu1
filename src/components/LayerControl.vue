<template>
  <div class="layer-control">
    <div class="layer-control-title">图层控制</div>
    <div class="layer-control-content">
      <div class="layer-item">
        <el-checkbox v-model="layers.administrative" @change="toggleAdministrative">
          行政区划
        </el-checkbox>
      </div>
      <div class="layer-group">
        <div class="group-title">兴趣点</div>
        <div class="layer-item">
          <el-checkbox v-model="layers.business" @change="(val) => togglePointLayer('business', val)">
            商业设施
          </el-checkbox>
        </div>
        <div class="layer-item">
          <el-checkbox v-model="layers.park" @change="(val) => togglePointLayer('park', val)">
            公园景点
          </el-checkbox>
        </div>
        <div class="layer-item">
          <el-checkbox v-model="layers.hospital" @change="(val) => togglePointLayer('hospital', val)">
            医疗机构
          </el-checkbox>
        </div>
        <div class="layer-item">
          <el-checkbox v-model="layers.heatmap" @change="(val) => togglePointLayer('heatmap', val)">
            热力分布
          </el-checkbox>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps } from 'vue'
import { togglePointsVisibility } from '@/utils/mapPoints'

const props = defineProps({
  map: {
    type: Object,
    required: true
  }
})

const layers = ref({
  administrative: true,
  business: true,
  park: true,
  hospital: true,
  heatmap: false // 默认不选中热力图
})

const toggleAdministrative = (visible) => {
  const map = props.map
  if (map) {
    // 控制行政区划图层的显示/隐藏
    map.setLayoutProperty('administrative-region-fills', 'visibility', visible ? 'visible' : 'none')
    map.setLayoutProperty('administrative-region-borders', 'visibility', visible ? 'visible' : 'none')
    map.setLayoutProperty('administrative-region-labels', 'visibility', visible ? 'visible' : 'none')
  }
}

const togglePointLayer = (category, visible) => {
  const map = props.map
  if (map) {
    togglePointsVisibility(map, category, visible)
  }
}
</script>

<style scoped>
.layer-control {
  position: fixed;
  right: 20px;
  top: 12%;
  background: #fff;
  border: 1px solid #000;
  border-radius: 4px;
  padding: 15px;
  width: 200px;
  box-shadow: 0 0 10px #CED9DA;
  color: #000;
  z-index: 1000;
}

.layer-control-title {
  font-size: 16px;
  color: #409EFF;
  border-bottom: 1px solid #CED9DA;
  padding-bottom: 10px;
  margin-bottom: 10px;
  text-align: center;
  /* font-family: 'YouSheBiaoTiHei', sans-serif; */
}

.layer-control-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.group-title {
  font-size: 14px;
  color: #409EFF;
  margin-bottom: 8px;
  font-family: 'YouSheBiaoTiHei', sans-serif;
}

.layer-item {
  margin: 2px 0;
}

/* :deep(.el-checkbox) {
  --el-checkbox-checked-bg-color: #b2ffff;
  --el-checkbox-checked-border-color: #b2ffff;
  --el-checkbox-checked-text-color: #0b2626;
  --el-checkbox-input-border-color: #b2ffff;
} */

/* :deep(.el-checkbox__label) {
  color: #fff;
  font-family: 'YouSheBiaoTiHei', sans-serif;
}

:deep(.el-checkbox__inner) {
  background-color: transparent;
  border-color: #b2ffff;
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #b2ffff;
  border-color: #b2ffff;
}

:deep(.el-checkbox__input.is-checked + .el-checkbox__label) {
  color: #b2ffff;
}

:deep(.el-checkbox__input:hover .el-checkbox__inner) {
  border-color: #b2ffff;
}

:deep(.el-checkbox__inner::after) {
  border-color: #0b2626;
} */
</style>
