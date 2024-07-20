import type { ParsedQs } from 'qs';

export type QueryParam = undefined | string | string[] | ParsedQs | ParsedQs[];
