import * as Phaser from 'phaser';
import { directionVector } from '../../shared/aggregation';
import {
  GRID_SIZE,
  type GridCell,
  type RouteResult,
  type Vec2,
  type VoyageState,
} from '../../shared/domain';
import { createMap } from '../../shared/map';
import { cellCenter, pointToCell } from '../geometry';
import type { ClientState } from '../state';

const COLOR_INK = 0x07101f;
const COLOR_AMBIENT = 0x43617d;
const COLOR_CYAN = 0x39d5ff;
const COLOR_BRIGHT_CYAN = 0x8be9ff;
const COLOR_STORM = 0x8c3cff;
const COLOR_STORM_EDGE = 0xff3d81;
const COLOR_BEACON = 0xffbd59;

export class DriftScene extends Phaser.Scene {
  private currentState: ClientState | null = null;
  private bounds = { x: 0, y: 0, size: 0 };
  private fieldLayer!: Phaser.GameObjects.Graphics;
  private routeLayer!: Phaser.GameObjects.Graphics;
  private markerLayer!: Phaser.GameObjects.Graphics;
  private driftling!: Phaser.GameObjects.Arc;
  private driftHalo!: Phaser.GameObjects.Arc;
  private routeTween: Phaser.Tweens.Tween | undefined;
  private readonly reducedMotion = matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  constructor(private readonly onCellSelected: (cell: GridCell) => void) {
    super('DriftScene');
  }

  create(): void {
    this.fieldLayer = this.add.graphics();
    this.routeLayer = this.add.graphics();
    this.markerLayer = this.add.graphics();
    this.driftHalo = this.add
      .circle(0, 0, 14, COLOR_CYAN, 0.18)
      .setVisible(false);
    this.driftling = this.add.circle(0, 0, 7, COLOR_CYAN, 1).setVisible(false);

    this.layout(this.scale.width, this.scale.height);
    this.input.on('pointerdown', this.handlePointerDown, this);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.disposeRouteTween();
      this.input.off('pointerdown', this.handlePointerDown, this);
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    });
  }

  renderVoyage(state: ClientState): void {
    this.currentState = state;
    if (!this.fieldLayer) return;

    this.disposeRouteTween();
    this.fieldLayer.clear();
    this.routeLayer.clear();
    this.markerLayer.clear();

    if (!state.voyage) {
      this.driftHalo.setVisible(false);
      this.driftling.setVisible(false);
      return;
    }

    this.drawField(state.voyage);
    this.drawRoute(state.voyage.route, false);
    if (state.previewRoute) this.drawRoute(state.previewRoute, true);
    this.animateDriftling(state.previewRoute ?? state.voyage.route);
  }

  private layout(width: number, height: number): void {
    const size = Math.min(width - 32, height - 24);
    this.bounds = {
      x: (width - size) / 2,
      y: (height - size) / 2,
      size,
    };

    if (this.currentState) this.renderVoyage(this.currentState);
  }

  private drawField(voyage: VoyageState): void {
    const map = createMap(voyage.mapSeed);
    const cellSize = this.bounds.size / GRID_SIZE;

    this.fieldLayer.fillStyle(COLOR_INK, 1);
    this.fieldLayer.fillRect(
      this.bounds.x,
      this.bounds.y,
      this.bounds.size,
      this.bounds.size
    );

    this.fieldLayer.lineStyle(1, COLOR_AMBIENT, 0.22);
    for (let index = 0; index <= GRID_SIZE; index += 1) {
      const offset = index * cellSize;
      this.fieldLayer.lineBetween(
        this.bounds.x + offset,
        this.bounds.y,
        this.bounds.x + offset,
        this.bounds.y + this.bounds.size
      );
      this.fieldLayer.lineBetween(
        this.bounds.x,
        this.bounds.y + offset,
        this.bounds.x + this.bounds.size,
        this.bounds.y + offset
      );
    }

    for (let index = 0; index < map.ambient.length; index += 1) {
      const vector = map.ambient[index];
      if (!vector) continue;
      this.drawArrow(
        this.fieldLayer,
        cellCenter(
          {
            x: index % GRID_SIZE,
            y: Math.floor(index / GRID_SIZE),
          },
          this.bounds
        ),
        vector,
        COLOR_AMBIENT,
        0.75,
        1.5,
        cellSize * 0.34
      );
    }

    for (const aggregate of voyage.aggregate) {
      this.drawArrow(
        this.fieldLayer,
        cellCenter(aggregate.cell, this.bounds),
        aggregate.vector,
        COLOR_CYAN,
        Math.min(0.35 + aggregate.count * 0.08, 0.9),
        2.5,
        cellSize * 0.42
      );
    }

    for (const storm of map.storms) {
      const center = this.mapPoint(storm.center);
      const radius = storm.radius * cellSize;
      this.fieldLayer.fillStyle(COLOR_STORM, 0.2);
      this.fieldLayer.fillCircle(center.x, center.y, radius);
      this.fieldLayer.lineStyle(2, COLOR_STORM_EDGE, 0.7);
      this.fieldLayer.strokeCircle(center.x, center.y, radius);
    }

    const beaconCenter = this.mapPoint(map.beacon.center);
    const beaconRadius = map.beacon.radius * cellSize;
    this.fieldLayer.fillStyle(COLOR_BEACON, 0.28);
    this.fieldLayer.fillCircle(beaconCenter.x, beaconCenter.y, beaconRadius);
    this.fieldLayer.lineStyle(3, COLOR_BEACON, 0.95);
    this.fieldLayer.strokeCircle(beaconCenter.x, beaconCenter.y, beaconRadius);

    const pending = this.currentState?.pending;
    if (pending) {
      this.markerLayer.lineStyle(3, COLOR_CYAN, 1);
      this.markerLayer.strokeRect(
        this.bounds.x + pending.cell.x * cellSize + 2,
        this.bounds.y + pending.cell.y * cellSize + 2,
        cellSize - 4,
        cellSize - 4
      );
      this.drawArrow(
        this.markerLayer,
        cellCenter(pending.cell, this.bounds),
        directionVector[pending.direction],
        COLOR_CYAN,
        1,
        4,
        cellSize * 0.34
      );
    }
  }

  private drawRoute(route: RouteResult, preview: boolean): void {
    if (route.points.length < 2) return;

    this.routeLayer.lineStyle(
      preview ? 4 : 3,
      preview ? COLOR_BRIGHT_CYAN : COLOR_CYAN,
      preview ? 1 : 0.78
    );
    for (let index = 1; index < route.points.length; index += 1) {
      if (preview && index % 2 === 0) continue;
      const from = route.points[index - 1];
      const to = route.points[index];
      if (!from || !to) continue;
      const start = this.mapPoint(from);
      const end = this.mapPoint(to);
      this.routeLayer.lineBetween(start.x, start.y, end.x, end.y);
    }
  }

  private animateDriftling(route: RouteResult): void {
    this.disposeRouteTween();
    if (route.points.length === 0) {
      this.driftHalo.setVisible(false);
      this.driftling.setVisible(false);
      return;
    }

    const terminal = route.points.at(-1);
    if (!terminal) return;
    if (this.reducedMotion || route.points.length === 1) {
      this.placeDriftling(this.mapPoint(terminal));
      return;
    }

    this.placeDriftling(this.mapPoint(route.points[0] ?? terminal));
    const duration = Math.min(5000, route.durationSeconds * 500);
    if (duration <= 0) {
      this.placeDriftling(this.mapPoint(terminal));
      return;
    }

    const routeTween = this.tweens.addCounter({
      from: 0,
      to: route.points.length - 1,
      duration,
      ease: 'Linear',
      onUpdate: (_tween, _target, _key, current) => {
        const startIndex = Math.min(
          Math.floor(current),
          route.points.length - 1
        );
        const endIndex = Math.min(startIndex + 1, route.points.length - 1);
        const start = route.points[startIndex];
        const end = route.points[endIndex];
        if (!start || !end) return;
        const fraction = current - startIndex;
        this.placeDriftling(
          this.mapPoint({
            x: start.x + (end.x - start.x) * fraction,
            y: start.y + (end.y - start.y) * fraction,
          })
        );
      },
      onComplete: () => {
        if (this.routeTween === routeTween) this.routeTween = undefined;
      },
    });
    this.routeTween = routeTween;
  }

  replayRoute(): void {
    const route = this.currentState?.voyage?.route;
    if (route) this.animateDriftling(route);
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    const phase = this.currentState?.phase;
    if (phase !== 'ready' && phase !== 'preview' && phase !== 'error') return;

    const cell = pointToCell({ x: pointer.x, y: pointer.y }, this.bounds);
    if (cell) this.onCellSelected(cell);
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    this.layout(gameSize.width, gameSize.height);
  }

  private mapPoint(point: Vec2): Vec2 {
    const cellSize = this.bounds.size / GRID_SIZE;
    return {
      x: this.bounds.x + point.x * cellSize,
      y: this.bounds.y + point.y * cellSize,
    };
  }

  private placeDriftling(point: Vec2): void {
    this.driftHalo.setPosition(point.x, point.y).setVisible(true);
    this.driftling.setPosition(point.x, point.y).setVisible(true);
  }

  private drawArrow(
    graphics: Phaser.GameObjects.Graphics,
    center: Vec2,
    vector: Vec2,
    color: number,
    alpha: number,
    width: number,
    lengthScale: number
  ): void {
    const magnitude = Math.hypot(vector.x, vector.y);
    if (magnitude < 0.001) return;

    const unit = { x: vector.x / magnitude, y: vector.y / magnitude };
    const length = lengthScale * magnitude;
    const start = {
      x: center.x - unit.x * length * 0.5,
      y: center.y - unit.y * length * 0.5,
    };
    const end = {
      x: center.x + unit.x * length * 0.5,
      y: center.y + unit.y * length * 0.5,
    };
    const head = Math.min(8, length * 0.4);
    const perpendicular = { x: -unit.y, y: unit.x };

    graphics.lineStyle(width, color, alpha);
    graphics.lineBetween(start.x, start.y, end.x, end.y);
    graphics.lineBetween(
      end.x,
      end.y,
      end.x - unit.x * head + perpendicular.x * head * 0.55,
      end.y - unit.y * head + perpendicular.y * head * 0.55
    );
    graphics.lineBetween(
      end.x,
      end.y,
      end.x - unit.x * head - perpendicular.x * head * 0.55,
      end.y - unit.y * head - perpendicular.y * head * 0.55
    );
  }

  private disposeRouteTween(): void {
    if (!this.routeTween) return;
    const tween = this.routeTween;
    this.routeTween = undefined;
    tween.stop();
  }
}
