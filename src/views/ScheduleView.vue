<template>
  <div class="schedule-view">
    <div class="content">
      <MonthGrid
        month="2025-10"
        :vehicles="vehicles"
        :onConfirmSelection="handleConfirm"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import MonthGrid from "@/components/MonthGrid.vue";

const vehicles = [
  { id: 1, vehicleNo: "A001" },
  { id: 2, vehicleNo: "B002" },
  { id: 3, vehicleNo: "C003" },
  { id: 4, vehicleNo: "D004" },
  { id: 5, vehicleNo: "E005" },
  { id: 6, vehicleNo: "F006" },
  { id: 7, vehicleNo: "G007" },
  { id: 8, vehicleNo: "H008" },
  { id: 9, vehicleNo: "I009" },
  { id: 10, vehicleNo: "J010" },
];

const handleConfirm = (selection: { vehicleId: number; startDay: number; endDay: number }) => {
  console.log("选择结果:", selection);
};
</script>
<style scoped lang="scss">
.schedule-view {
  padding: 30px;
  display: relative;
  overflow: hidden;
}
</style>
