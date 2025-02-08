import type { Scene } from '@babylonjs/core'
import type { BusData } from './type'
import { Color3, Color4, Mesh, MeshBuilder, ParticleSystem, StandardMaterial, Texture, Vector3 } from '@babylonjs/core'
import { pick, pipe } from 'remeda'
import { minecraftResource } from './constant'

type ElData = Extract<BusData, { type: 'add' }>

export interface Hole {
  id: string;
  width: number;
  height: number;
  mesh: Mesh;
  diggingParticles: ParticleSystem;
  setVisible: (value: boolean) => void;
}

interface CreateHoleParam {
  data: ElData;
  windowSize: { width: number; height: number };
}

/** 遮擋目前洞口位置，以免特定透視角度看到別的凹洞 */
function createHoleOccluder(param: CreateHoleParam, scene: Scene) {
  const { data, windowSize } = param

  const depth = 10

  const material = pipe(
    new StandardMaterial('hole-occluder', scene),
    (material) => {
      material.forceDepthWrite = true
      material.disableLighting = true

      return material
    },
  )

  const mesh = pipe(
    MeshBuilder.CreateBox(data.id, {
      width: 1,
      height: 1,
      depth,
      sideOrientation: Mesh.BACKSIDE,
    }, scene),
    (occluder) => {
      // 使用縮放對應寬高，這樣就可以自由調整尺寸，而不用變更 mesh
      occluder.scaling.x = data.width
      occluder.scaling.y = data.height

      occluder.position.x = data.x + data.width / 2 - windowSize.width / 2
      occluder.position.y = -data.y - data.height / 2 + windowSize.height / 2

      occluder.material = material
      occluder.visibility = 0.0001
      occluder.renderingGroupId = 0

      return occluder
    },
  )

  return mesh
}

function createMesh(param: CreateHoleParam, scene: Scene) {
  const { data, windowSize } = param
  const resource = minecraftResource[data.blockType]

  const depth = Math.max(data.width, data.height)

  const texture = pipe(
    new Texture(
      resource.texture,
      scene,
      true,
      false,
      Texture.NEAREST_NEAREST,
    ),
    (texture) => {
      /** 方塊基準尺寸 */
      const baseSize = 80

      texture.uScale = data.width / baseSize
      texture.vScale = data.height / baseSize

      return texture
    },
  )

  const material = pipe(
    new StandardMaterial('hole', scene),
    (material) => {
      material.emissiveColor = new Color3(0.1, 0.1, 0.1)
      material.diffuseTexture = texture

      return material
    },
  )

  const mesh = pipe(
    MeshBuilder.CreateBox(data.id, {
      width: 1,
      height: 1,
      depth,
      sideOrientation: Mesh.BACKSIDE,
    }, scene),
    (hole) => {
      // 使用縮放對應寬高，這樣就可以自由調整尺寸，而不用變更 mesh
      hole.scaling.x = data.width
      hole.scaling.y = data.height

      hole.renderingGroupId = 1
      hole.material = material

      hole.position.x = data.x + data.width / 2 - windowSize.width / 2
      hole.position.y = -data.y - data.height / 2 + windowSize.height / 2
      hole.position.z = depth / 2

      hole.isVisible = !data.visible
      hole.metadata = {
        ...data,
        position: hole.position,
      }

      return hole
    },
  )

  return mesh
}

function createDiggingParticles(param: CreateHoleParam, scene: Scene) {
  const { data, windowSize } = param
  const { x, y, width, height, blockType } = data
  const resource = minecraftResource[blockType]

  const texture = new Texture(
    resource.texture,
    scene,
    true,
    false,
    Texture.NEAREST_NEAREST,
  )

  const particleSystem = new ParticleSystem('digging-particles', 50, scene)
  particleSystem.particleTexture = texture

  // 切割圖片
  particleSystem.isAnimationSheetEnabled = true
  particleSystem.spriteCellHeight = 2
  particleSystem.spriteCellWidth = 2

  particleSystem.emitter = new Vector3(
    x + width / 2 - windowSize.width / 2,
    -y - height / 2 + windowSize.height / 2,
    0,
  )

  particleSystem.renderingGroupId = 2

  particleSystem.blendMode = ParticleSystem.BLENDMODE_STANDARD
  particleSystem.color1 = new Color4(1, 1, 1, 1)
  particleSystem.color2 = new Color4(0.8, 0.8, 0.8, 1)
  particleSystem.colorDead = new Color4(1, 1, 1, 1)

  particleSystem.minSize = 10
  particleSystem.maxSize = 15

  particleSystem.minLifeTime = 1
  particleSystem.maxLifeTime = 1.5

  particleSystem.createBoxEmitter(
    new Vector3(width / 2, height / 2, 0),
    new Vector3(width / -2, height / 2, 0),
    new Vector3(width / 2, height / 2, 0),
    new Vector3(width / -2, height / -2, 0),
  )

  particleSystem.gravity = new Vector3(0, -height, 0)
  particleSystem.emitRate = 6
  particleSystem.updateSpeed = 0.02

  return particleSystem
}

export function createHole(param: CreateHoleParam, scene: Scene): Hole {
  const { data } = param

  const mesh = createMesh(param, scene)
  const diggingParticles = createDiggingParticles(param, scene)
  const occluder = createHoleOccluder(param, scene)

  function setVisible(value: boolean) {
    mesh.isVisible = value
    occluder.isVisible = !value
  }

  return {
    ...pick(data, ['id', 'width', 'height']),
    mesh,
    diggingParticles,
    setVisible,
  }
}
