<template>
  <div class="grid day" :style="{ '--col-count': daysInMonth.length }">
    <template v-for="(vehicle, i) in [{ id: 0, vehicleNo: '' }, ...vehicles]">
      <template v-for="(day, j) in daysInMonth">
        <!-- 第一行表头 -->
        <div v-if="i === 0" class="cell header-label" :key="'header-' + day">
          <span>{{ j === 0 ? '' : day }}</span>
        </div>
        <!-- 第一列名称 -->
        <div v-else-if="j === 0" class="cell left-label" :key="'header-' + vehicle.id">
          <span>{{ vehicle.vehicleNo }}</span>
        </div>
        <template v-else :key="'cell-' + i + '-' + j">
          <div
            v-if="isActive(i, j)"
            :id="'cell-' + i + '-' + j"
            :class="[
              'cell cell-body',
              {
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
import { computed, ref } from 'vue'

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

const daysInMonth = computed(() => {
  const [year, month] = props.month.split('-').map(Number)
  // 增加一天，因为 第一列是名称
  return Array.from({ length: new Date(year, month, 0).getDate() + 1 }, (_, i) => i)
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
</script>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(var(--col-count), minmax(50px, 1fr));
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

.header-label {
  cursor: default;
  &:not(:first-child) {
    border-left: none;
  }
}
.left-label {
  cursor: default;
  &:not(:first-child) {
    border-top: none;
  }
}
</style>
