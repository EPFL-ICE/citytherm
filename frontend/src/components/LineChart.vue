<script setup lang="ts">
import { computed, ref } from 'vue'
import VChart from 'vue-echarts'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
  GridComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsOption } from 'echarts/types/dist/shared'

interface Series {
  name: string
  data: number[]
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
  CanvasRenderer
])

const chartOptions = computed<EChartsOption>(() => {
  return {
    tooltip: {
      formatter: (p: any) => `<b>${p.seriesName}</b><br/>Time: ${p.name}<br/>Value: ${p.data}`
    },
    grid: {
      left: 50,
      right: 50,
      bottom: 50,
      top: 70
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
    series: props.series.map((series, index) => ({
      type: 'line',
      data: series.data,
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      },
      name: series.name
    }))
  } as unknown as EChartsOption
})
</script>

<template>
  <v-chart :option="chartOptions" autoresize />
</template>
