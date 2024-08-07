import { ActorRefFrom, assign, setup } from 'xstate';
import {
  BuiltImage,
  MultiscaleSpatialImage,
} from '@itk-viewer/io/MultiscaleSpatialImage.js';
import { Range, Ranges, ReadonlyRange } from '@itk-viewer/io/types.js';

const NORMALIZED_RANGE_DEFAULT = [0.2, 0.8] as const;

const computeColorRange = (
  dataRange: ReadonlyRange,
  normalizedRange: ReadonlyRange,
) => {
  const delta = dataRange[1] - dataRange[0];
  return normalizedRange.map((bound) => {
    return bound * delta + dataRange[0];
  }) as Range;
};

const computeNormalizedColorRange = (
  dataRange: ReadonlyRange,
  colorRange: ReadonlyRange,
) => {
  const delta = dataRange[1] - dataRange[0];
  return colorRange.map((bound) => {
    return (bound - dataRange[0]) / delta;
  }) as Range;
};

type Context = {
  image: MultiscaleSpatialImage;
  dataRanges: Ranges; // by component
  colorRanges: Ranges;
  normalizedColorRanges: Ranges;
};

export const image = setup({
  types: {} as {
    input: MultiscaleSpatialImage;
    context: Context;
    events:
      | { type: 'builtImage'; builtImage: BuiltImage }
      | {
          type: 'normalizedColorRange';
          range: readonly [number, number];
          component: number;
        };
  },
  actions: {
    updateColorRanges: assign({
      colorRanges: ({ context: { dataRanges, normalizedColorRanges } }) => {
        return dataRanges.map((range, component) => {
          return computeColorRange(range, normalizedColorRanges[component]);
        });
      },
    }),
  },
}).createMachine({
  id: 'camera',
  initial: 'active',
  context: ({ input: image }) => ({
    image,
    dataRanges: [],
    colorRanges: [],
    normalizedColorRanges: [],
  }),
  states: {
    active: {
      on: {
        builtImage: {
          actions: [
            assign({
              dataRanges: ({ context, event }) => {
                const {
                  builtImage: { ranges },
                } = event;
                if (!ranges) return context.dataRanges;
                return ranges.map((range, component) => {
                  // only grow range
                  const oldRange = context.dataRanges?.[component] ?? [
                    Number.POSITIVE_INFINITY,
                    Number.NEGATIVE_INFINITY,
                  ];
                  return [
                    Math.min(range[0], oldRange[0]),
                    Math.max(range[1], oldRange[1]),
                  ] as const;
                });
              },
            }),
            assign({
              normalizedColorRanges: ({ context }) => {
                return context.dataRanges.map((dataRange, component) => {
                  if (!context.normalizedColorRanges[component])
                    return NORMALIZED_RANGE_DEFAULT;
                  // if data range changes
                  // scale normalizedColorRange so colorRanges doesn't change
                  const colorRange = context.colorRanges[component];
                  return computeNormalizedColorRange(dataRange, colorRange);
                });
              },
            }),
            'updateColorRanges',
          ],
        },
        normalizedColorRange: {
          actions: [
            assign({
              normalizedColorRanges: ({ context, event }) => {
                context.normalizedColorRanges[event.component] = event.range;
                return context.normalizedColorRanges;
              },
            }),
            'updateColorRanges',
          ],
        },
      },
    },
  },
});

export type Image = ActorRefFrom<typeof image>;
export type ImageSnapshot = ReturnType<Image['getSnapshot']>;
