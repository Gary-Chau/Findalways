import type { BlockType } from './type'

export const minecraftResource: Record<
  BlockType,
  {
    texture: string;
    sound: Record<'dig' | 'place' | 'break', string[]>;
  }
> = {
  dirt: {
    texture: '/minecraft/textures/block/dirt.png',
    sound: {
      dig: [
        '/minecraft/sounds/block/rooted_dirt/step1.ogg',
        '/minecraft/sounds/block/rooted_dirt/step2.ogg',
        '/minecraft/sounds/block/rooted_dirt/step3.ogg',
        '/minecraft/sounds/block/rooted_dirt/step4.ogg',
        '/minecraft/sounds/block/rooted_dirt/step5.ogg',
        '/minecraft/sounds/block/rooted_dirt/step6.ogg',
      ],
      place: [
        '/minecraft/sounds/dig/gravel1.ogg',
        '/minecraft/sounds/dig/gravel2.ogg',
        '/minecraft/sounds/dig/gravel3.ogg',
        '/minecraft/sounds/dig/gravel4.ogg',
      ],
      break: [
        '/minecraft/sounds/dig/gravel1.ogg',
        '/minecraft/sounds/dig/gravel2.ogg',
        '/minecraft/sounds/dig/gravel3.ogg',
        '/minecraft/sounds/dig/gravel4.ogg',
      ],
    },
  },
  stone: {
    texture: '/minecraft/textures/block/stone.png',
    sound: {
      dig: [
        '/minecraft/sounds/step/stone1.ogg',
        '/minecraft/sounds/step/stone2.ogg',
        '/minecraft/sounds/step/stone3.ogg',
        '/minecraft/sounds/step/stone4.ogg',
      ],
      place: [
        '/minecraft/sounds/dig/stone1.ogg',
        '/minecraft/sounds/dig/stone2.ogg',
        '/minecraft/sounds/dig/stone3.ogg',
        '/minecraft/sounds/dig/stone4.ogg',
      ],
      break: [
        '/minecraft/sounds/dig/stone1.ogg',
        '/minecraft/sounds/dig/stone2.ogg',
        '/minecraft/sounds/dig/stone3.ogg',
        '/minecraft/sounds/dig/stone4.ogg',
      ],
    },
  },
  sand: {
    texture: '/minecraft/textures/block/sand.png',
    sound: {
      dig: [
        '/minecraft/sounds/dig/sand1.ogg',
        '/minecraft/sounds/dig/sand2.ogg',
        '/minecraft/sounds/dig/sand3.ogg',
        '/minecraft/sounds/dig/sand4.ogg',
      ],
      place: [
        '/minecraft/sounds/dig/sand1.ogg',
        '/minecraft/sounds/dig/sand2.ogg',
        '/minecraft/sounds/dig/sand3.ogg',
        '/minecraft/sounds/dig/sand4.ogg',
      ],
      break: [
        '/minecraft/sounds/dig/sand1.ogg',
        '/minecraft/sounds/dig/sand2.ogg',
        '/minecraft/sounds/dig/sand3.ogg',
        '/minecraft/sounds/dig/sand4.ogg',
      ],
    },
  },
}
