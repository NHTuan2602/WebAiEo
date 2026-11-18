export const LEGACY_DEFAULT_TEACHER_NAME = 'Thầy Minh IELTS Master';

export const BRAND_INFO = {
  shortName: 'IELTS Ms. Như',
  siteName: 'Luyện Thi IELTS Nha Trang',
  englishSubName: 'IELTS with Ms. Như',
  domain: 'https://luyenthiieltsnhatrang.up.railway.app',
  domainHost: 'luyenthiieltsnhatrang.up.railway.app',
  pageTitle: 'Luyện Thi IELTS Nha Trang - IELTS with Ms. Như | Hệ Thống Thi Thử Trực Tuyến',
  teacherName: 'Ms. Như',
  teacherFullName: 'Ms. Như - IELTS Nha Trang',
  slogan: 'Practice makes perfect.',
  motto: 'English is always a work in progress. You never really stop learning',
  established: 'Luyện thi IELTS chuyên sâu tại Nha Trang từ 2018',
  phoneDisplay: '0969 917 460',
  phoneHref: 'tel:0969917460',
  address: '33/16 Bà Triệu, TP. Nha Trang, Khánh Hòa',
  facebookUrl: 'https://www.facebook.com/luyenthiIELTSwithMs.Nhu',
  facebookHandle: 'fb.com/luyenthiIELTSwithMs.Nhu',
  blogUrl: 'https://luyenthiieltsnhatrang.blogspot.com/',
  blogHost: 'luyenthiieltsnhatrang.blogspot.com',
  avatarUrl: '/brand-avatar.jpg?v=2'
};

export const ADMIN_PAYMENT_CONTACT = {
  phoneDisplay: '0367 073 526',
  phoneRaw: '0367073526',
  phoneHref: 'tel:0367073526',
  zaloUrl: 'https://zalo.me/0367073526',
  label: 'Quản Trị Viên'
};

/**
 * Migrate untouched legacy seed teacher account names and apply Ms. Như default brand avatar.
 */
export function normalizeBrandTeacherUser(user) {
  if (!user || typeof user !== 'object') return user;
  if (user.username === 'teacher_ielts') {
    const nextName = user.name === LEGACY_DEFAULT_TEACHER_NAME ? BRAND_INFO.teacherFullName : user.name;
    const isBrandDefaultAvatar = !user.avatarUrl || user.avatarUrl.startsWith('/brand-avatar.jpg');
    const nextAvatar = isBrandDefaultAvatar ? BRAND_INFO.avatarUrl : user.avatarUrl;
    if (nextName !== user.name || nextAvatar !== user.avatarUrl) {
      return { ...user, name: nextName, avatarUrl: nextAvatar };
    }
  }
  return user;
}
