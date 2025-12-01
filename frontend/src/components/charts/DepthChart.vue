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
  data: number[] | number[][]
  color?: string
}

const props = defineProps<{
  axisX: {
    name: string
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
        `<b>${p.seriesName}</b><br/>Depth: ${p.data[1]}m<br/>Value: ${p.data[0].toFixed(2)}`
    },
    grid: {
      left: 20,
      right: 20,
      bottom: 20,
      top: 70
    },
    xAxis: {
      type: 'value',
      name: props.axisX.name,
      nameLocation: 'middle',
      nameGap: 30,
      min: 15,
      max: 40
    },
    yAxis: {
      type: 'value',
      name: 'Depth (m)',
      inverse: true
      // max: 2
    },
    legend: {
      data: props.series.map((series) => series.name),
      selected: Object.fromEntries(props.series.map((series, i) => [series.name, i % 4 === 0])),
      top: '0',
      left: 'center',
      orient: 'horizontal'
    },
    series: props.series.map((series) => {
      let color = series.color
      if (!color) {
        color = DEFAULT_PALETTE[autoColorIndex % DEFAULT_PALETTE.length]
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
          color
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
