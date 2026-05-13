export function createPageUrl(pageName: string) {
    return '/' + pageName.replace(/ /g, '-');
}


export const getLocalizedField = (item, field) => {
    if (!item) return "";

    const value = item[field];

    // ✅ case: object with translations
    if (typeof value === "object" && value !== null) {
      return (
        value[lang] ||      // current language
        value.en ||         // fallback to English
        value.def ||        // fallback to default (VERY IMPORTANT)
        Object.values(value).find(v => v) || // first non-empty
        ""
      );
    }

    // ✅ legacy flat fields
    if (item[`${field}_${lang}`]) return item[`${field}_${lang}`];
    if (item[`${field}_en`]) return item[`${field}_en`];

    // ✅ plain string
    if (typeof value === "string") return value;

    return "";
  };



  