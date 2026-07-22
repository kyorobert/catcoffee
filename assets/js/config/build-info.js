export const APP_VERSION =
  'V0.55.1-alpha｜美術規格與素材清理版';

export const BUILD_ID = '0551a';

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
