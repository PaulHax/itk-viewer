import { createCamera } from '@itk-viewer/viewer/camera-machine.js';
import { createViewport } from './remote-viewport.js';

const address = 'http://localhost:3000';
const parent = document.getElementById('viewport');

if (!parent) {
  throw new Error('Could not find viewport element');
}

const viewport = createViewport({
  parent,
  address,
});

const camera = createCamera();
viewport.send({ type: 'setCamera', camera });
