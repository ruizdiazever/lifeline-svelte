export { default as Lifeline } from "./lifeline.svelte";
export { default as LifelineDesktop } from "./lifeline-desktop.svelte";
export { default as LifelineVertical } from "./lifeline-vertical.svelte";
export { default as LifelineMarkerColumn } from "./lifeline-marker.svelte";
export { default as LifelineLegend } from "./lifeline-legend.svelte";
export { default as LifelineEventText } from "./lifeline-event-text.svelte";
export { default as LifelineEventMedia } from "./lifeline-event-media.svelte";
export { default as LifelinePeople } from "./lifeline-people.svelte";
export { default as LifelineLightbox } from "./lifeline-lightbox.svelte";
export { default as LifelineFloatingPhotos } from "./lifeline-photos.svelte";
export { default as LifelinePhotoCard } from "./lifeline-photo-card.svelte";
export { default as CompanyIcon } from "./company-icon.svelte";
export { default as LifelineStickyLabels } from "./lifeline-labels.svelte";
export { default as LifelineHoverImageProvider } from "./lifeline-hover-image-provider.svelte";
export { default as LifelineFireworksProvider } from "./lifeline-fireworks-provider.svelte";
export { default as LifelineShell } from "./lifeline-shell.svelte";
export { default as LifelineNav } from "./lifeline-nav.svelte";
export { default as LifelineStage } from "./lifeline-stage.svelte";
export { default as LifelineFooter } from "./lifeline-footer.svelte";

export { registerCompanyIcons, type CompanyIconEntry, type CompanyIconId } from "./company-icon";
export { defineLifeline, localizeLifelineMarkers, LIFELINE_CURRENT_YEAR } from "./lifeline-data";
export type { LifelineRecord, LifelineMilestone, LifelineMilestones, LifelineTextOverrides, LifelineGranularity } from "./lifeline-data";
export { createLifelineScroll, type LifelineScrollOptions } from "./lifeline-scroll.svelte";
export { createLifelineVerticalScroll, type LifelineVerticalScrollOptions } from "./lifeline-vertical-scroll.svelte";
export { createLifelineIntro } from "./lifeline-intro.svelte";
export { getLifelineHoverImage, type LifelineHoverImageContext } from "./lifeline-hover-image";
export { getLifelineFireworks, type LifelineFireworksContext } from "./lifeline-fireworks";
export type { LifelineLightboxStart } from "./lifeline-lightbox";
export { aggregateLifelinePeople, type AggregatedLifelinePerson } from "./lifeline-people";
export {
  getLifelineEventImage,
  getLifelineEventEffect,
  getLifelineEventKey,
} from "./lifeline-event";
export {
  LIFELINE_LABEL_COLUMN_WIDTH,
  LIFELINE_LABEL_GAP,
  LIFELINE_STICKY_SHIELD_WIDTH,
  LIFELINE_STICKY_LEFT,
} from "./lifeline-labels";
export { LIFELINE_MOBILE_BREAKPOINT } from "./lifeline-layout";
export { getMarkerHeight, getMarkerWidth, hasMarkerContent, hasMarkerPeople } from "./lifeline-utils";

export type {
  LifelineCompany,
  LifelineEvent,
  LifelineEventImage,
  LifelineEventObject,
  LifelineEventSegment,
  LifelineLegendItem,
  LifelineMarker,
  LifelineMentor,
  LifelineMetPerson,
  LifelineMode,
  LifelinePhoto,
  LifelineProps,
} from "./types";
