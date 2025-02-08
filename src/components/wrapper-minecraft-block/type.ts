import type { EventBusKey } from '@vueuse/core'

export type BlockType = 'dirt' | 'stone' | 'sand'

export type BusData = {
  type: 'add';
  blockType: BlockType;
  id: string;
  height: number;
  width: number;
  x: number;
  y: number;
  visible: boolean;
} |
{
  type: 'update';
  id: string;
  height: number;
  width: number;
  x: number;
  y: number;
  visible: boolean;
} |
{
  type: 'dig';
  id: string;
  isActive: boolean;
}

export const eventKey: EventBusKey<BusData> = Symbol('wrapper-minecraft-block')
