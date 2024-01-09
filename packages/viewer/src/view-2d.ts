import {
  Actor,
  AnyActorRef,
  assign,
  enqueueActions,
  fromPromise,
  setup,
} from 'xstate';
import {
  MultiscaleSpatialImage,
  BuiltImage,
} from '@itk-viewer/io/MultiscaleSpatialImage.js';
import { CreateChild } from './children.js';

const viewContext = {
  slice: 0.5,
  scale: 0,
  image: undefined as MultiscaleSpatialImage | undefined,
  spawned: {} as Record<string, AnyActorRef>,
};

export const view2d = setup({
  types: {} as {
    context: typeof viewContext;
    events:
      | { type: 'setImage'; image: MultiscaleSpatialImage }
      | { type: 'setSlice'; slice: number }
      | { type: 'setScale'; scale: number }
      | CreateChild;
  },
  actors: {
    imageBuilder: fromPromise(
      async ({
        input: { image, scale, slice },
      }: {
        input: {
          image: MultiscaleSpatialImage;
          scale: number;
          slice: number;
        };
      }) => {
        const worldBounds = await image.getWorldBounds(scale);
        const zWidth = worldBounds[5] - worldBounds[4];
        const worldZ = worldBounds[4] + zWidth * slice;
        worldBounds[4] = worldZ;
        worldBounds[5] = worldZ;
        const builtImage = await image.getImage(scale, worldBounds);
        return builtImage as BuiltImage;
      },
    ),
  },
}).createMachine({
  context: () => {
    return JSON.parse(JSON.stringify(viewContext));
  },
  id: 'view2d',
  initial: 'view2d',
  states: {
    view2d: {
      on: {
        createChild: {
          actions: [
            assign({
              spawned: ({
                spawn,
                context: { spawned },
                event: { logic, onActor },
              }) => {
                // @ts-expect-error cannot spawn actor of type that is not in setup()
                const child = spawn(logic);
                const id = Object.keys(spawned).length.toString();
                onActor(child);
                return {
                  ...spawned,
                  [id]: child,
                };
              },
            }),
          ],
        },
        setImage: {
          actions: [
            assign({
              image: ({ event }) => event.image,
              scale: ({ event }) => event.image.coarsestScale,
              slice: 0.5,
            }),
            enqueueActions(({ context, enqueue }) => {
              Object.values(context.spawned).forEach((actor) => {
                enqueue.sendTo(actor, {
                  type: 'setImage',
                  image: context.image,
                });
              });
            }),
          ],
          target: '.buildingImage',
        },
        setSlice: {
          actions: [assign({ slice: ({ event }) => event.slice })],
          target: '.buildingImage',
        },
        setScale: {
          actions: [assign({ scale: ({ event }) => event.scale })],
          target: '.buildingImage',
        },
      },
      initial: 'idle',
      states: {
        idle: {},
        buildingImage: {
          invoke: {
            input: ({ context }) => {
              const { image, scale, slice } = context;
              if (!image) throw new Error('No image available');
              return {
                image,
                scale,
                slice,
              };
            },
            src: 'imageBuilder',
            onDone: {
              actions: [
                enqueueActions(({ context, enqueue, event: { output } }) => {
                  Object.values(context.spawned).forEach((actor) => {
                    enqueue.sendTo(actor, {
                      type: 'imageBuilt',
                      image: output,
                    });
                  });
                }),
              ],
            },
          },
        },
      },
    },
  },
});

export type View2dActor = Actor<typeof view2d>;
