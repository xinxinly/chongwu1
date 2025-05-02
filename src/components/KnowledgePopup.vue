<template>
  <div v-if="modelValue" class="knowledge-popup-overlay" @click.self="closePopup">
    <div class="knowledge-popup">
      <div class="knowledge-header">
        <h2 class="knowledge-title">宠物知识科普</h2>
        <el-icon class="close-icon" @click="closePopup">
          <Close />
        </el-icon>
      </div>
      <div class="knowledge-content">
        <div v-for="(animal, index) in animals" :key="index" class="animal-item">
          <div class="animal-header">
            <div class="animal-image-container">
              <img :src="`/images/${animal.img}`" :alt="animal.name" class="animal-image" />
            </div>
            <h3 class="animal-name">{{ animal.name }}</h3>
          </div>
          <div class="divider"></div>
          <p class="animal-description">{{ animal.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, defineProps, defineEmits } from 'vue'
import { Close } from '@element-plus/icons-vue'
import animalsData from '../assets/animals.json'

defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])
const animals = ref([])

onMounted(() => {
  animals.value = animalsData
})

const closePopup = () => {
  emit('update:modelValue', false)
}
</script>

<style scoped>
.knowledge-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: transparent;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 99999;
  /* backdrop-filter: blur(5px); */
}

.knowledge-popup {
  width: 70%;
  height: 80%;
  background-color: #1E3C72;
  border: 1px solid #1B1B1B;
  border-radius: 8px;
  box-shadow: 0 0 20px rgba(178, 255, 255, 0.4);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.knowledge-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 20px;
  background-color: #546767;
  /* background-image: linear-gradient(to right, #0b2626, #104848); */
  border-bottom: 1px solid #1B1B1B;
}

.knowledge-title {
  margin: 0;
  color: #fff;
  font-family: 'YouSheBiaoTiHei', sans-serif;
  font-size: 1.8rem;
  /* background: linear-gradient(180deg, #fff, #b2ffff);
  background-clip: text;
  -webkit-text-fill-color: transparent; */
}

.close-icon {
  color: #b2ffff;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-icon:hover {
  color: #ff6b6b;
  transform: scale(1.1);
}

.knowledge-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #b2ffff #0b2626;
}

.knowledge-content::-webkit-scrollbar {
  width: 8px;
}

.knowledge-content::-webkit-scrollbar-track {
  background: #0b2626;
}

.knowledge-content::-webkit-scrollbar-thumb {
  background-color: #b2ffff;
  border-radius: 4px;
}

.animal-item {
  background-color: #546767;
  border: 1px solid rgba(178, 255, 255, 0.3);
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  transition: all 0.3s ease;
}

.animal-item:hover {
  border-color: #b2ffff;
  box-shadow: 0 0 10px rgba(178, 255, 255, 0.2);
}

.animal-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.animal-image-container {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #b2ffff;
  box-shadow: 0 0 10px rgba(178, 255, 255, 0.3);
  margin-right: 15px;
  flex-shrink: 0;
}

.animal-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.animal-name {
  margin: 0;
  color: #b2ffff;
  font-family: 'YouSheBiaoTiHei', sans-serif;
  font-size: 1.4rem;
}

.divider {
  height: 1px;
  background: linear-gradient(to right, transparent, #b2ffff, transparent);
  margin: 10px 0 15px;
}

.animal-description {
  color: #fff;
  line-height: 1.6;
  margin: 0;
  text-align: justify;
  text-indent: 2em;
}

/* 响应式设计 */
@media screen and (max-width: 768px) {
  .knowledge-popup {
    width: 85%;
    height: 85%;
  }
  
  .knowledge-title {
    font-size: 1.5rem;
  }
  
  .animal-name {
    font-size: 1.2rem;
  }
  
  .animal-image-container {
    width: 50px;
    height: 50px;
  }
}

@media screen and (max-width: 480px) {
  .knowledge-popup {
    width: 95%;
    height: 90%;
  }
  
  .knowledge-title {
    font-size: 1.3rem;
  }
  
  .animal-name {
    font-size: 1.1rem;
  }
  
  .animal-image-container {
    width: 40px;
    height: 40px;
  }
  
  .animal-header {
    margin-bottom: 5px;
  }
}
</style>
