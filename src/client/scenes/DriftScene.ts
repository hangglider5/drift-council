import * as Phaser from 'phaser';
import type { GridCell } from '../../shared/domain';
import type { ClientState } from '../state';

export class DriftScene extends Phaser.Scene {
  constructor(onCellSelected: (cell: GridCell) => void) {
    super('DriftScene');
    void onCellSelected;
  }

  renderVoyage(_state: ClientState): void {}

  replayRoute(): void {}
}
