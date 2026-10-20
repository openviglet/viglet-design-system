import { exportToXlsx as writeXlsx } from "./export-xlsx";

export { cn, truncateMiddle, getFlagEmoji, getHashedColor } from "./utils";
export { setupAxiosInterceptors } from "./axios";

/**
 * Write rows to an .xlsx download.
 *
 * @deprecated Import it from `@viglet/viglet-design-system/xlsx` (VDS219). This
 * root re-export is why every consumer has to install `xlsx`, even one that
 * never exports a sheet. It goes once no consumer imports it from the root,
 * and the peer becomes optional then.
 */
export const exportToXlsx: typeof writeXlsx = writeXlsx;
