import * as THREE from 'three'

export function createBuildingMaterial(): THREE.MeshStandardMaterial {
  // Custom shader material that picks color based on face normal
  const baseMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true })

  baseMaterial.onBeforeCompile = (shader) => {
    // Existing vertex: add world position
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `
      #include <common>
      attribute vec3 instanceTopColor;
      attribute vec3 instanceSideColor;
      attribute vec3 instanceWindowColor;
      varying vec3 vTopColor;
      varying vec3 vSideColor;
      varying vec3 vWindowColor;
      varying vec3 vNormalW;
      varying vec3 vWorldPos;
    `
    )

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      vTopColor = instanceTopColor;
      vSideColor = instanceSideColor;
      vWindowColor = instanceWindowColor;
      vNormalW = normalize(mat3(modelMatrix) * normal);
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPos = worldPos.xyz;
    `
    )

    // FRAGMENT SHADER
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `
      #include <common>
      varying vec3 vTopColor;
      varying vec3 vSideColor;
      varying vec3 vWindowColor;
      varying vec3 vNormalW;
      varying vec3 vWorldPos;
    `
    )

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `
      // Calculate top/side base
      float topFactor = smoothstep(0.8, 1.0, vNormalW.y);
      vec3 baseColor = mix(vSideColor, vTopColor, topFactor);

      // Procedural window pattern (only for sides)
      if (topFactor < 0.5) {
        vec3 n = normalize(vNormalW);
        vec3 localPos;

        // Distinguish faces by dominant axis and sign
        if (abs(n.x) > abs(n.z)) {
          // +/- X faces → use Y/Z plane
          localPos = vec3(vWorldPos.z * sign(n.x), vWorldPos.y, 0.0);
        } else {
          // +/- Z faces → use X/Y plane
          localPos = vec3(vWorldPos.x * sign(n.z), vWorldPos.y, 0.0);
        }

        // Grid frequency: X → building width, Y → window floors
        vec2 factors = vec2(0.2, 8.0);
        vec2 offset = vec2(0.7, 0.0); // Offset grid a bit
        vec2 cell = fract((localPos.xy + offset) * factors);

        // Each cell: window if inside interior of cell
        float window = step(0.1, cell.x) * step(0.1, cell.y) *
                      (1.0 - step(0.9, cell.x)) *
                      (1.0 - step(0.9, cell.y));

        vec3 windowColor = vWindowColor;

        // Mix base with window glow
        baseColor = mix(baseColor, windowColor, step(1.0, window));
      }

      diffuseColor.rgb *= baseColor;
    `
    )
  }

  return baseMaterial
}

export function createSoilMaterial(): THREE.ShaderMaterial {
  // Custom shader material that picks color based on face normal
  return new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vColor;
      void main() {
        vColor = color;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
    varying vec3 vColor;
    void main() {
      gl_FragColor = vec4(vColor, 1.0);
    }
  `,
    vertexColors: true,
    side: THREE.DoubleSide
  })
}

const errorColor = new THREE.Color().setRGB(1, 0.3, 0.7) // Pinkish color for error
const codeToColor: { [key: number]: THREE.Color } = {
  2007: new THREE.Color().setRGB(0.25, 0.25, 0.25), // Asphalt
  2045: new THREE.Color().setRGB(0.6, 0.6, 0.6), // High albedo pavement
  2011: new THREE.Color().setRGB(0.8, 0.7, 0.5), // Sandy loam
  2018: new THREE.Color().setRGB(0.1, 0.5, 0.9) // Water reservoir
} as const

export function simulationSoilTypeCodeToColor(code: number): THREE.Color {
  return codeToColor[code] ?? errorColor
}

export function createOscillatingPlaneMaterial(
  color = 0xdddd22,
  minOpacity = 0.4,
  maxOpacity = 0.5,
  speed = 3.0
) {
  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `

  const fragmentShader = `
    uniform float uTime;
    uniform vec3  uColor;
    uniform float uMinOpacity;
    uniform float uMaxOpacity;
    uniform float uSpeed;

    void main() {
      float mid = (uMinOpacity + uMaxOpacity) * 0.5;
      float amplitude = (uMaxOpacity - uMinOpacity) * 0.5;
      float opacity = mid + amplitude * sin(uTime * uSpeed);
      gl_FragColor = vec4(uColor, opacity);
    }
  `

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uMinOpacity: { value: minOpacity },
      uMaxOpacity: { value: maxOpacity },
      uSpeed: { value: speed }
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    side: THREE.DoubleSide
  })

  // Automatically update uTime each frame without manual animation loop code
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = material.uniforms.uTime
    const clock = new THREE.Clock()

    // Hook into WebGLRenderer’s per-frame update
    const originalOnBeforeRender = material.onBeforeRender
    material.onBeforeRender = (renderer, scene, camera, geometry, object, group) => {
      material.uniforms.uTime.value = clock.getElapsedTime()
      if (originalOnBeforeRender) {
        originalOnBeforeRender(renderer, scene, camera, geometry, object, group)
      }
    }
  }

  return material
}
