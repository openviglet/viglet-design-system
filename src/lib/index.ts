export { cn, truncateMiddle, getFlagEmoji, getHashedColor } from "./utils";
export { setupAxiosInterceptors } from "./axios";

// `exportToXlsx` lives on its own entry, `@viglet/viglet-design-system/xlsx` (VDS219): the
// root no longer imports `xlsx`, so a product that never exports a sheet installs nothing for it.
