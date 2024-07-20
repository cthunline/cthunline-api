import type { Sketch } from '../schemas/definitions.js';

/**
Builds the cache key for play sketch
*/
export const getSketchCacheKey = (sessionId: number) => `sketch-${sessionId}`;

export const defaultSketchData: Sketch = {
    displayed: false,
    paths: [],
    images: [],
    tokens: []
};
