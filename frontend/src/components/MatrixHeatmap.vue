<script setup lang="ts">
import { computed, ref } from 'vue'
import VChart from 'vue-echarts'
import * as echarts from 'echarts/core'
import { HeatmapChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
  GridComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsOption } from 'echarts/types/dist/shared'
import type { GraphAxis } from '@/lib/simulation/graphAxis'

const props = defineProps<{
  axisX: GraphAxis
  axisY: GraphAxis
  expectedValueRange?: { min: number; max: number }
  data: [number, number, number][]
}>()

echarts.use([
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
  GridComponent,
  HeatmapChart,
  CanvasRenderer
])

function getCenteredValue(x: number, s: number): number {
  return x * s + s / 2
}

function getTooltip(p: any): string {
  console.log(p)
  const xValue = props.axisX.valuesOverride
    ? props.axisX.valuesOverride[p.value[0]]
    : getCenteredValue(p.value[0], props.axisX.cellSize)
  const yValue = props.axisY.valuesOverride
    ? props.axisY.valuesOverride[p.value[1]]
    : getCenteredValue(p.value[1], props.axisY.cellSize)

  return (
    `${props.axisX.name}: ${xValue} ${props.axisX.unit}<br>` +
    `${props.axisY.name}: ${yValue} ${props.axisY.unit}<br>` +
    `value: ${p.value[2].toFixed(2)}`
  )
}

const chartOptions = computed<EChartsOption>(() => {
  return {
    tooltip: {
      formatter: (p: any) => getTooltip(p)
    },
    grid: {
      left: 50,
      right: 50,
      bottom: 50,
      top: 70
    },
    xAxis: {
      type: 'category',
      name: `${props.axisX.name} (${props.axisX.unit})`,
      data: Array.from(
        { length: props.axisX.max - props.axisX.min },
        (_, i) => i + props.axisX.min
      ), // keep indices
      axisLabel: {
        formatter: (val) =>
          props.axisX.valuesOverride
            ? props.axisX.valuesOverride[val]
            : getCenteredValue(val, props.axisX.cellSize) // convert 0–99 to meters
      },
      nameLocation: 'middle',
      nameGap: 30
    },
    yAxis: {
      type: 'category',
      name: `${props.axisY.name} (${props.axisY.unit})`,
      data: Array.from(
        { length: props.axisY.max - props.axisY.min },
        (_, i) => i + props.axisY.min
      ), // keep indices
      axisLabel: {
        formatter: (val) =>
          props.axisY.valuesOverride
            ? props.axisY.valuesOverride[val]
            : getCenteredValue(val, props.axisY.cellSize) // convert 0–99 to meters
      },
      nameLocation: 'middle',
      nameGap: 40
    },
    visualMap: {
      min: props.expectedValueRange?.min ?? 0,
      max: props.expectedValueRange?.max ?? 100,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      top: 0,
      itemHeight: 400
    },
    series: [
      {
        type: 'heatmap',
        data: props.data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  } as unknown as EChartsOption
})
</script>

<template>
  <v-chart :option="chartOptions" autoresize />
</template>
