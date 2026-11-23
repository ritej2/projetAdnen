// Mapping des assets images du design web Superio / JobFlow pour React Native

export const COMPANY_LOGOS = {
  1: require('../../assets/images/company-1.png'),
  2: require('../../assets/images/company-2.png'),
  3: require('../../assets/images/company-3.png'),
  4: require('../../assets/images/company-4.png'),
  5: require('../../assets/images/company-5.png'),
  6: require('../../assets/images/company-6.png'),
  7: require('../../assets/images/company-7.png'),
};

export const BANNER_IMAGE = require('../../assets/images/banner-img-2.png');

export const CANDIDATE_AVATARS = {
  1: require('../../assets/images/candidate-1.png'),
  2: require('../../assets/images/candidate-2.png'),
  3: require('../../assets/images/candidate-3.png'),
  4: require('../../assets/images/candidate-4.png'),
};

export const getCompanyLogoAsset = (id) => {
  const safeId = typeof id === 'number' && id > 0 ? ((id - 1) % 6) + 1 : 1;
  return COMPANY_LOGOS[safeId] || COMPANY_LOGOS[1];
};

export const getCandidateAvatarAsset = (id) => {
  const safeId = typeof id === 'number' && id > 0 ? ((id - 1) % 4) + 1 : 1;
  return CANDIDATE_AVATARS[safeId] || CANDIDATE_AVATARS[1];
};

export default {
  COMPANY_LOGOS,
  BANNER_IMAGE,
  CANDIDATE_AVATARS,
  getCompanyLogoAsset,
  getCandidateAvatarAsset,
};
