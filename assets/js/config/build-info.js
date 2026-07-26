export const APP_VERSION =
  'V0.57.5-alpha｜正交房間外殼與門比例修正版';

export const BUILD_ID = '0575b';

// This key is part of the public save contract. Never change it for cache recovery.
export const SAVE_KEY = 'catCafePhaserV0540';

export class BuildMismatchError extends Error {
  constructor(htmlBuildId, jsBuildId) {
    super(`介面版本不一致（HTML Build：${htmlBuildId || 'unknown'}；JavaScript Build：${jsBuildId || 'unknown'}）`);
    this.name = 'BuildMismatchError';
    this.htmlBuildId = htmlBuildId || '';
    this.jsBuildId = jsBuildId || '';
  }
}

export function assertBuildConsistency(htmlBuildId, jsBuildId = BUILD_ID) {
  if (htmlBuildId !== jsBuildId) {
    throw new BuildMismatchError(htmlBuildId, jsBuildId);
  }
  return true;
}
