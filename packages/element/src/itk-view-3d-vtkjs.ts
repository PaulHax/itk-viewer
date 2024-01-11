import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { ref } from 'lit/directives/ref.js';
import { Actor } from 'xstate';

import { view3dLogic } from '@itk-viewer/vtkjs/view-3d-vtkjs.machine.js';
import { SpawnController } from './spawn-controller.js';
import { SelectorController } from 'xstate-lit';
import { Camera } from '@itk-viewer/viewer/camera.js';
import './itk-camera.js';

type ComponentActor = Actor<typeof view3dLogic>;

@customElement('itk-view-3d-vtkjs')
export class ItkView3dVtkjs extends LitElement {
  actor: ComponentActor | undefined;
  container: HTMLElement | undefined;

  spawner = new SpawnController(
    this,
    'renderer',
    view3dLogic,
    (actor: ComponentActor) => this.setActor(actor),
  );

  cameraActor:
    | SelectorController<ComponentActor, Camera | undefined>
    | undefined;

  getActor() {
    return this.actor;
  }

  protected setActor(actor: ComponentActor) {
    this.actor = actor;
    this.sendContainer();
    this.cameraActor = new SelectorController(
      this,
      this.actor,
      (state) => state.context.camera,
    );
  }

  protected sendContainer() {
    if (!this.actor) return;
    this.actor.send({ type: 'setContainer', container: this.container });
  }

  protected onContainer(container: Element | undefined) {
    if (container instanceof HTMLElement || container == undefined) {
      this.container = container;
      this.sendContainer();
    }
  }

  render() {
    return html`
      <itk-camera .actor=${this.cameraActor?.value} class="container">
        <div class="container" ${ref(this.onContainer)}></div>
      </itk-camera>
    `;
  }

  static styles = css`
    :host {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
    }

    .container {
      flex: 1;
      min-height: 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'itk-view-3d-vtkjs': ItkView3dVtkjs;
  }
}
