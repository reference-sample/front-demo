<template>
  <div
    v-loading="loading"
    class="warpper"
    ref="warpper"
    @scroll="onScroll"
    @mousemove="onMouseMove"
    @mouseleave="onMouseLeave"
  >
    <div class="grid day" :style="{ '--col-count': daysInMonth.length }">
      <template v-for="(vehicle, i) in [{ id: 0, vehicleNo: '' }, ...vehicles]">
        <template v-for="(date, j) in daysInMonth">
          <template v-if="i === 0">
            <div
              v-if="j === 0"
              :class="['cell header-first', {scrolled: scrolledX || scrolledY }]"
              :key="'header-first-' + date.text"
            >
              <!-- 第一行表头 -->
              <span>{{ date.text }}</span>
            </div>
            <div
              v-else-if="j === daysInMonth.length - 1"
              :class="['cell operation-header', {scrolled: scrolledY || scrolledX }]"
              :key="'header-operation-' + date.text"
            >
              <!-- 第一行表头 -->
              <span>{{ date.text }}</span>
            </div>
            <div
              v-else
              :class="['cell header-label', {scrolled: scrolledY }]"
              :key="'header-label-' + date.text"
            >
              <!-- 第一行表头 -->
              <span>{{ date.text }}</span>
            </div>
          </template>

          <div
            v-else-if="j === daysInMonth.length - 1"
            :class="['cell operation-label', { scrolled: scrolledX }]"
            :key="'operation-' + date.text"
          >
            <!-- 最后一列操作 -->
            <span><el-icon><Finished /></el-icon> <el-icon><Delete /></el-icon> <el-icon><Promotion /></el-icon></span>
          </div>
          
          <div
            v-else-if="j === 0"
            :class="['cell left-label', { scrolled: scrolledX }]"
            :key="'header-' + vehicle.id"
          >
            <!-- 第一列名称 -->
            <span>{{ vehicle.vehicleNo }}</span>
          </div>
          <template v-else :key="'cell-' + i + '-' + j">
            <div
              v-if="isActive(i, j) || isPublished(i, j)"
              :id="'cell-' + i + '-' + j"
              :class="[
                'cell cell-body',
                {
                  published: isPublished(i, j),
                  active: isActive(i, j),
                },
              ]"
            >
              <el-popover placement="top" :width="180">
                <p>要删除该班次吗?</p>
                <div style="text-align: right; margin: 0">
                  <el-button size="small" text>取消</el-button>
                  <el-button size="small" type="primary">确定</el-button>
                </div>
                <template #reference>
                  <div>{{ '上午' }}</div>
                </template>
              </el-popover>
            </div>
            <div
              v-else
              :id="'cell-' + i + '-' + j"
              :class="[
                'cell cell-body',
                {
                  selected: isSelected(i, j),
                },
              ]"
              @mousedown="startSelect(i, j)"
              @mouseenter="moveSelect(i, j)"
              @mouseup="endSelect"
            ></div>
          </template>
        </template>
      </template>
    </div>
  </div>

  <!-- 确认弹窗 -->
  <el-dialog v-model="dialogVisible" title="确认预约" @close="onCancel">
    <p>确认选择 {{ startDay }} - {{ endDay }} 吗？</p>
    <span slot="footer" class="dialog-footer">
      <el-button @click="onCancel">取消</el-button>
      <el-button type="primary" @click="onConfirm">确认</el-button>
    </span>
  </el-dialog>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { da } from 'element-plus/es/locales.mjs'
import { computed, ref, watch } from 'vue'

dayjs.locale('zh-cn')

interface Vehicle {
  id: number
  vehicleNo: string
}

// props
const props = defineProps<{
  month: string // 'YYYY-MM'
  vehicles: Vehicle[]
  onConfirmSelection: (selection: { vehicleId: number; startDay: number; endDay: number }) => void
}>()

const loading = ref(false)

const publishedData = ref<any[]>([])

const daysInMonth = computed(() => {
  const dataStr = props.month + '-01'
  const dayCounts = dayjs(dataStr).daysInMonth()
  const dates = Array.from({ length: dayCounts }, (_, i) => {
    const date = dayjs(dataStr).add(i, 'day')
    return {
      id: i,
      text: date.format('MM-DD') + ' ' + date.format('dd'),
      date: date.format('YYYY-MM-DD'),
    }
  })
  // 收尾各增加一天，因为 第一列是名称，最后一列是操作
  return [{ id: -1, text: '', date: '' }, ...dates, {id: -2, text: '操作', date: '' }]
})

// 拖选状态
const selected = ref<string[]>([])
const startCell = ref<string | null>(null)
const dialogVisible = ref(false)
const startDay = ref<number | null>(null)
const endDay = ref<number | null>(null)
const selectedVehicleId = ref<number | null>(null)
const picked = ref<string[]>([])

// 判断是否高亮
const isSelected = (i: number, j: number) => selected.value.includes(`${i}*${j}`)
const isActive = (i: number, j: number) => picked.value.includes(`${i}*${j}`)
const isPublished = (i: number, j: number) => publishedData.value.includes(`${i}*${j}`)

watch(
  () => props.month,
  () => {
    selected.value = []
    picked.value = []
    startCell.value = null
    startDay.value = null
    endDay.value = null
    selectedVehicleId.value = null
    picked.value = []
    dialogVisible.value = false

    // TODO: 查询已有的数据
    loading.value = true
    publishedData.value = [`2*4`, '2*5', '2*6', '3*4']
    loading.value = false
  },
  { immediate: true },
)

// 鼠标事件
const startSelect = (i: number, j: number) => {
  startCell.value = `${i}*${j}`
  selected.value = [`${i}*${j}`]
}

const moveSelect = (i: number, j: number) => {
  if (!startCell.value) return
  const [startX, startY] = startCell.value.split('*').map(Number)
  if (i !== startX) return
  const y1 = Math.min(j, startY)
  const y2 = Math.max(j, startY)
  selected.value = []
  for (let y = y1; y <= y2; y++) {
    selected.value.push(`${i}*${y}`)
  }
}

const endSelect = () => {
  if (!selected.value.length) return
  const first = selected.value[0]
  const last = selected.value[selected.value.length - 1]
  const [i, start] = first.split('*').map(Number)
  const [, end] = last.split('*').map(Number)

  startDay.value = Math.min(start, end)
  endDay.value = Math.max(start, end)
  selectedVehicleId.value = props.vehicles[i].id
  dialogVisible.value = true
  startCell.value = null
}

// 弹窗操作
const onCancel = () => {
  selected.value = []
  dialogVisible.value = false
}

const onConfirm = () => {
  if (selectedVehicleId.value !== null && startDay.value && endDay.value) {
    props.onConfirmSelection({
      vehicleId: selectedVehicleId.value,
      startDay: startDay.value,
      endDay: endDay.value,
    })
    picked.value.push(...selected.value)
  }
  selected.value = []
  dialogVisible.value = false
}

// 滚动事件
let scrollSpeed = 5 // 每次滚动像素
let edgeThreshold = 100 // 离边界多近开始触发
let scrollInterval = null
const scrolledX = ref(false)
const scrolledY = ref(false)

const warpper = ref<HTMLDivElement | null>(null)
const onScroll = () => {
  const box = warpper.value
  if (!box) return
  scrolledX.value = box.scrollLeft > 0
  scrolledY.value = box.scrollTop > 0
}
const onMouseMove = (e) => {
  const box = warpper.value
  if (!box) return
  const rect = box.getBoundingClientRect()
  const x = e.clientX - rect.left

  clearInterval(scrollInterval)

  if (x < edgeThreshold) {
    // 靠近左边
    scrollInterval = setInterval(() => {
      box.scrollLeft -= scrollSpeed
    }, 16)
  } else if (x > rect.width - edgeThreshold) {
    // 靠近右边
    scrollInterval = setInterval(() => {
      box.scrollLeft += scrollSpeed
    }, 16)
  }
}

const onMouseLeave = () => {
  clearInterval(scrollInterval)
}
</script>

<style scoped>
.warpper {
  overflow: auto;
  width: 80%;
  /* height: 540px; */
  &::-webkit-scrollbar {
    height: 0px;
    width: 0px;
  }
  &:hover::-webkit-scrollbar {
    height: 12px;
    width: 12px;
    background-color: #eaeaea;
    border-radius: 3px;
  }
}
.grid {
  display: grid;
  grid-template-columns: repeat(var(--col-count), minmax(80px, 1fr));
  user-select: none;
  color: #303030;
}

.cell {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 56px;
  border: 1px solid #eee;
  cursor: pointer;
  font-weight: 500;
  background-color: #fff;
}
.cell-body {
  color: #606060;
  border-top: none;
  border-left: none;
}

.cell.selected {
  background-color: #3270ff;
  color: #fff;
}

.cell.active {
  background-color: rgba(50, 112, 255, 0.13);
}
.cell.published {
  background: rgba(50, 112, 255, 0.23) url(@/assets/已发布.png) top right / 24px 24px no-repeat;
}
.cell.unpublished {
  background: rgba(50, 112, 255, 0.13) url(@/assets/未发布.png) top right / 24px 24px no-repeat;
}

.header-label {
  position: sticky;
  top: 0;
  cursor: default;
  border-left: none;
  z-index: 2;
}

.header-first {
  position: sticky;
  top: 0;
  left: 0;
  z-index: 3;
  box-shadow: 2px 2px 5px -2px rgba(119, 117, 117, 0.3);
}
.header-first.scrolled {
  box-shadow: 2px 2px 5px -2px rgba(119, 117, 117, 0.3);
}

.left-label {
  position: sticky;
  left: 0;
  cursor: default;
  border-top: none;
  z-index: 1;
}
.operation-label {
  position: sticky;
  right: 0;
  cursor: default;
  border-top: none;
  border-left: none;
  z-index: 1;
  box-shadow: -2px 0 5px -2px rgba(119, 117, 117, 0.3);
}
.operation-header {
  position: sticky;
  top: 0;
  right: 0;
  z-index: 3;
  border-left: none;
  border-top: 1px solid #eee;
  box-shadow: -2px 2px 5px -2px rgba(119, 117, 117, 0.3);
}
.header-label.scrolled {
  box-shadow: 0 2px 5px -2px rgba(119, 117, 117, 0.3);
}
.left-label.scrolled {
  box-shadow: 2px 0 5px -2px rgba(119, 117, 117, 0.3);
}
.operation-label.scrolled {
  box-shadow: -2px 0 5px -2px rgba(119, 117, 117, 0.3);
}
</style>
