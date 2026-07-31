import { getContext, setContext } from "svelte";
import type { LifelineEventImage } from "./types";

export interface LifelineHoverImageContext {
  show(image: LifelineEventImage): void;
  hide(): void;
}

const KEY = Symbol("lifeline-hover-image");

export function setLifelineHoverImageContext(ctx: LifelineHoverImageContext) {
  setContext(KEY, ctx);
}

export function getLifelineHoverImage(): LifelineHoverImageContext | undefined {
  return getContext<LifelineHoverImageContext | undefined>(KEY);
}
