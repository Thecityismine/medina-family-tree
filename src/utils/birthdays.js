const isValidDate = (date) => date instanceof Date && !Number.isNaN(date.getTime());

const buildDate = (year, month, day) => {
  const date = new Date(year, month - 1, day);
  if (!isValidDate(date)) return null;
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
};

const validateYear = (date) => {
  const year = date.getFullYear();
  const currentYear = new Date().getFullYear();
  if (year < 1800 || year > currentYear + 1) {
    return null;
  }
  return date;
};

export const parseBirthDate = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    return validateYear(value);
  }

  if (typeof value === 'object') {
    if (typeof value.toDate === 'function') {
      return validateYear(value.toDate());
    }
    if (typeof value.seconds === 'number') {
      return validateYear(new Date(value.seconds * 1000));
    }
    if (typeof value._seconds === 'number') {
      return validateYear(new Date(value._seconds * 1000));
    }
  }

  if (typeof value === 'string') {
    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const year = Number(isoMatch[1]);
      const month = Number(isoMatch[2]);
      const day = Number(isoMatch[3]);
      return validateYear(buildDate(year, month, day));
    }

    const mdyMatch = value.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
    if (mdyMatch) {
      const month = Number(mdyMatch[1]);
      const day = Number(mdyMatch[2]);
      const year = Number(mdyMatch[3]);
      return validateYear(buildDate(year, month, day));
    }

    const parsed = new Date(value);
    if (isValidDate(parsed)) {
      return validateYear(parsed);
    }
  }

  if (typeof value === 'number') {
    const parsed = new Date(value);
    if (isValidDate(parsed)) {
      return validateYear(parsed);
    }
  }

  return null;
};

export const formatBirthDate = (value) => {
  const date = parseBirthDate(value);
  if (!date) return 'Not set';
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

export const calculateAge = (value) => {
  const birthDate = parseBirthDate(value);
  if (!birthDate) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  if (age < 0 || age > 130) {
    return null;
  }
  return age;
};

export const getNextBirthdayDate = (value, today = new Date()) => {
  const birthDate = parseBirthDate(value);
  if (!birthDate) return null;
  const thisYear = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
  if (thisYear < today) {
    return new Date(today.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate());
  }
  return thisYear;
};
