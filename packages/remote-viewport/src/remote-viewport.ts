import { hyphaWebsocketClient } from 'imjoy-rpc';
import { createViewport as parentCreateViewport } from '@itk-viewer/viewer/viewport.js';

export const createViewport = ({
  parent,
  address,
}: {
  parent: HTMLElement;
  address: string;
}) => {
  parent.innerHTML = `<div>Remote viewport at ${address}</div>`;

  hyphaWebsocketClient
    .connectToServer({
      server_url: 'https://ai.imjoy.io',
    })
    .then(async (api) => {
      const renderer = await api.getService('agave-ai4life');
      console.log('Renderer', renderer);

      renderer.hello();

      renderer.setup();
      renderer.run();
      // const frame = await renderer.render();
      // console.log('Frame', frame);
    });

  return parentCreateViewport();
};
