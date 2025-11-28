<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
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
import type { HeatmapMetadata } from '../simulation/heatmap/heatmapUtils'

export interface HeatmapData {
  value: [number, number, number | null]
  metadata?: HeatmapMetadata
}

const emit = defineEmits<{
  (e: 'point-clicked', pointSlug: string): void
}>()

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
  resetVisualMapRangeOnDataChange?: boolean
}>()

echarts.use([
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
  GridComponent,
  HeatmapChart,
  CanvasRenderer
])

const heatmapChart = ref<InstanceType<typeof VChart> | null>(null)

function getGraduationValue(x: number, s: number): number {
  return x * s
}

function getTooltip(p: any): string {
  const xValue = props.axisX.valuesOverride
    ? props.axisX.valuesOverride[p.value[0]]
    : getGraduationValue(p.value[0], props.axisX.cellSize)
  const yValue = props.axisY.valuesOverride
    ? props.axisY.valuesOverride[p.value[1]]
    : getGraduationValue(p.value[1], props.axisY.cellSize)

  const specialPoint =
    props.showSpecialPoints && p.data.metadata?.pointSlug
      ? `<br/><br/><b>${p.data.metadata.pointName}</b><br/>Time series data available for this point !<br />Click to see the time series graph`
      : ''

  return (
    `${props.axisX.name}: ${xValue} ${props.axisX.unit}<br>` +
    `${props.axisY.name}: ${yValue} ${props.axisY.unit}<br>` +
    `value: ${p.value[2].toFixed(2)}` +
    specialPoint
  )
}

// 1. Separate normal data
const mainData = computed(() => {
  if (!props.showSpecialPoints) return props.data
  return props.data.filter((d) => !d.metadata?.pointSlug)
})

// 2. Separate special data
const specialData = computed(() => {
  if (!props.showSpecialPoints) return []
  return props.data
    .filter((d) => d.metadata?.pointSlug)
    .map((d) => ({
      ...d,
      visualMap: false // Exclude from visual map scaling
    }))
})

const chartOptions = computed<EChartsOption>(() => {
  return {
    tooltip: {
      formatter: (p: any) => getTooltip(p)
    },
    grid: {
      left: 50,
      right: 90,
      bottom: 0,
      top: 0
    },
    xAxis: {
      type: 'category',
      name: `${props.axisX.name} (${props.axisX.unit})`,
      data: Array.from(
        { length: props.axisX.max - props.axisX.min },
        (_, i) => i + props.axisX.min
      ), // keep indices
      axisLabel: {
        formatter: (val: any) =>
          props.axisX.valuesOverride
            ? props.axisX.valuesOverride[val]
            : getGraduationValue(val, props.axisX.cellSize) // convert 0–99 to meters
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
        formatter: (val: any) =>
          props.axisY.valuesOverride
            ? props.axisY.valuesOverride[val]
            : getGraduationValue(val, props.axisY.cellSize) // convert 0–99 to meters
      },
      nameLocation: 'middle',
      nameGap: 40
    },
    visualMap: {
      min: props.overrideMinMax?.min ?? props.expectedValueRange?.min ?? 0,
      max: props.overrideMinMax?.max ?? props.expectedValueRange?.max ?? 100,
      calculable: true,
      realtime: false,
      orient: 'vertical',
      right: 0,
      top: 'center',
      itemHeight: 200,
      inRange: {
        color: props.colormap
      },
      formatter: (value: number) => value.toFixed(2)
    },
    series: [
      {
        name: 'Heatmap',
        type: 'heatmap',
        data: mainData.value,
        emphasis: {
          itemStyle: {
            shadowBlur: 5,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      },
      // Series 1: Special Points (Overlay)
      {
        name: 'SpecialPoints',
        type: 'heatmap',
        data: specialData.value,
        // 4. Force this series to sit on top of the other
        z: 10,
        // 5. Apply fixed styles specifically for this series
        itemStyle: {
          color: '#ff13f0',
          borderColor: 'black',
          borderWidth: 1,
          borderType: 'solid'
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 8,
            shadowColor: 'rgba(0, 0, 0, 1)'
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

watch(
  () => props.data,
  async () => {
    await nextTick() // wait for DOM and chart updates

    const chart = heatmapChart.value
    if (chart) {
      if (props.resetVisualMapRangeOnDataChange) {
        chart.dispatchAction({
          type: 'selectDataRange',
          batch: [
            {
              visualMapIndex: 0,
              selected: [
                props.overrideMinMax?.min ?? props.expectedValueRange?.min ?? 0,
                props.overrideMinMax?.max ?? props.expectedValueRange?.max ?? 100
              ]
            }
          ]
        })
      }
    }
  },
  { deep: true }
)
</script>

<template>
  <v-chart ref="heatmapChart" :option="chartOptions" autoresize @click="onClickHeatmap" />
</template>
