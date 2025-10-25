<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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

export interface HeatmapMetadata {
  pointSlug?: string
}

export interface HeatmapData {
  value: [number, number, number | null]
  metadata?: HeatmapMetadata
}

const emit = defineEmits<{
  (e: 'point-clicked', pointSlug: string): void
}>();

const props = defineProps<{
  axisX: GraphAxis
  axisY: GraphAxis
  expectedValueRange?: { min: number; max: number }
  data: HeatmapData[]
  showSpecialPoints?: boolean
  overrideMinMax?: {
    min: number
    max: number
  }
  colormap?: string[]
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
  const xValue = props.axisX.valuesOverride
    ? props.axisX.valuesOverride[p.value[0]]
    : getCenteredValue(p.value[0], props.axisX.cellSize)
  const yValue = props.axisY.valuesOverride
    ? props.axisY.valuesOverride[p.value[1]]
    : getCenteredValue(p.value[1], props.axisY.cellSize)

  const specialPoint = (props.showSpecialPoints && p.data.metadata?.pointSlug) ? '<br/><br/>Time series data available for this point !<br />Click to see the time series graph' : ''

  return (
    `${props.axisX.name}: ${xValue} ${props.axisX.unit}<br>` +
    `${props.axisY.name}: ${yValue} ${props.axisY.unit}<br>` +
    `value: ${p.value[2].toFixed(2)}` + specialPoint
  )
}

const reshapedData = computed(() => {
  if (!props.showSpecialPoints) return props.data

  return props.data.map((d) => ({
    ...d,
    visualMap: !d.metadata?.pointSlug
  }))
})

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
      min: props.overrideMinMax?.min ?? props.expectedValueRange?.min ?? 0,
      max: props.overrideMinMax?.max ?? props.expectedValueRange?.max ?? 100,
      calculable: true,
      realtime: false,
      orient: 'horizontal',
      left: 'center',
      top: 0,
      itemHeight: 400,
      inRange: {
        color: props.colormap
      }
    },
    series: [
      {
        type: 'heatmap',
        data: reshapedData.value,
        itemStyle: {
          color: (params: { data: HeatmapData }) => {
            if (params.data.metadata?.pointSlug) {
              return '#ff13f0'
            }
            return undefined
          }
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 5,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  } as unknown as EChartsOption
})

function onClickHeatmap(params: echarts.ECElementEvent) {
  if (!props.showSpecialPoints) return
  
  if (!params.data) return
  const metadata = (params.data as HeatmapData).metadata
  if (!metadata?.pointSlug) return

  emit('point-clicked', metadata.pointSlug)
}
</script>

<template>
  <v-chart :option="chartOptions" autoresize @click="onClickHeatmap" />
</template>
