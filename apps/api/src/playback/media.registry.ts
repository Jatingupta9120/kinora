/**
 * Openly licensed / publicly provided test media. Titles reference these by id;
 * only the playback service turns an id into a URL, after an entitlement check.
 */
export interface MediaAsset {
  id: string;
  manifestUrl: string;
  durationSec: number;
  credit: string;
  license: string;
}

export const MEDIA: Record<string, MediaAsset> = {
  bbb: {
    id: 'bbb',
    manifestUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    durationSec: 596,
    credit: 'Big Buck Bunny (c) 2008 Blender Foundation | peach.blender.org',
    license: 'CC BY 3.0',
  },
  tos: {
    id: 'tos',
    manifestUrl:
      'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    durationSec: 734,
    credit: 'Tears of Steel (c) 2012 Blender Foundation | mango.blender.org',
    license: 'CC BY 3.0',
  },
  bipbop: {
    id: 'bipbop',
    manifestUrl:
      'https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_16x9/bipbop_16x9_variant.m3u8',
    durationSec: 1800,
    credit: 'Apple HLS example stream (bipbop)',
    license: 'Apple developer sample stream, for testing',
  },
};
