interface ConfigForVariable {
  heatmap: {
    colormap: string[]
  }
}

// Hardcoded for now, should it be in variableAttributes.json ?
export const simulationVariablesConfig: Record<string, ConfigForVariable> = {
  T: {
    heatmap: {
      colormap: [
        '#313695',
        '#4575b4',
        '#74add1',
        '#abd9e9',
        '#e0f3f8',
        '#ffffbf',
        '#fee090',
        '#fdae61',
        '#f46d43',
        '#d73027',
        '#a50026'
      ]
    }
  },
  RelHum: {
    heatmap: {
      colormap: ['#f7fbff', '#08306b']
    }
  },
  WindSpd: {
    heatmap: {
      colormap: ['#ddd', '#000']
    }
  },
  default: {
    heatmap: {
      colormap: [
        '#ffffd9',
        '#edf8b1',
        '#c7e9b4',
        '#7fcdbb',
        '#41b6c4',
        '#1d91c0',
        '#225ea8',
        '#0c2c84'
      ]
    }
  }
}
