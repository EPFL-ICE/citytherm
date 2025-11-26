<script setup lang="ts">
import { computed, ref } from 'vue'
import VChart from 'vue-echarts'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
  GridComponent,
  LegendComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsOption } from 'echarts/types/dist/shared'

const DEFAULT_PALETTE = [
  '#5470c6',
  '#91cc75',
  '#fac858',
  '#ee6666',
  '#73c0de',
  '#3ba272',
  '#fc8452',
  '#9a60b4',
  '#ea7ccc'
]

interface Series {
  name: string
  data: number[]
  color?: string
}

const props = defineProps<{
  axisX: {
    name: string
    slots: {
      name: string
    }[]
  }
  series: Series[]
}>()

echarts.use([
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
  GridComponent,
  LineChart,
  CanvasRenderer,
  LegendComponent
])

const chartOptions = computed<EChartsOption>(() => {
  let autoColorIndex = 0

  return {
    tooltip: {
      formatter: (p: any) =>
        `<b>${p.seriesName}</b><br/>Time: ${p.name}<br/>Value: ${p.data.toFixed(2)}`
    },
    grid: {
      left: 20,
      right: 20,
      bottom: 20,
      top: 40
    },
    xAxis: {
      type: 'category',
      name: props.axisX.name,
      data: props.axisX.slots.map((slot) => slot.name),
      nameLocation: 'middle',
      nameGap: 30
    },
    yAxis: {
      type: 'value'
    },
    legend: {
      data: props.series.map((series) => series.name),
      top: '0',
      left: 'center',
      orient: 'horizontal'
    },
    series: props.series.map((series) => {
      if (!series.color) {
        series.color = DEFAULT_PALETTE[autoColorIndex % DEFAULT_PALETTE.length]
        autoColorIndex += 1
      }

      return {
        type: 'line',
        data: series.data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        itemStyle: {
          color: series.color
        },
        name: series.name
      }
    })
  } as unknown as EChartsOption
})
</script>

<template>
  <v-chart :option="chartOptions" autoresize />
</template>
