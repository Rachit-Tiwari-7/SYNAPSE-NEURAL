import { MockHealthProfile } from './types';
import { rachitTiwariProfile } from './rachitTiwari';
import { shaikhWarsiProfile } from './shaikhWarsi';

export * from './types';
export {
  rachitTiwariProfile,
  shaikhWarsiProfile
};

/**
 * Verified ABHA Team Member Health Profiles
 * Filtered to exclusively maintain Rachit Tiwari and Shaikh Mohammad Warsi.
 */
export const MOCK_HEALTH_PROFILES: MockHealthProfile[] = [
  rachitTiwariProfile,
  shaikhWarsiProfile
];

export const DEFAULT_HEALTH_PROFILE: MockHealthProfile = rachitTiwariProfile;

export function getHealthProfileById(profileId: string): MockHealthProfile {
  return MOCK_HEALTH_PROFILES.find(p => p.profileId === profileId) || DEFAULT_HEALTH_PROFILE;
}
