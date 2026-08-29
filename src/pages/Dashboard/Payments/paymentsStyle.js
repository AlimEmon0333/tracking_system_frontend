import { colors, borderRadius, shadows } from "../../../styles/theme";

export const paymentsStyles = () => ({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    paddingBottom: "40px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
  },
  headerText: {
    fontSize: "24px",
    fontWeight: 700,
    color: colors.textPrimary,
    letterSpacing: "-0.5px",
  },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
  },
  kpiCard: {
    padding: "24px",
    borderRadius: borderRadius.lg,
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    boxShadow: shadows.sm,
    border: `1px solid ${colors.border}`,
  },
  kpiTitle: {
    fontSize: "14px",
    fontWeight: 600,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  kpiValue: {
    fontSize: "28px",
    fontWeight: 700,
  },
  kpiSubtext: {
    fontSize: "13px",
    fontWeight: 500,
    marginTop: "4px",
  },
  tabsContainer: {
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    boxShadow: shadows.sm,
    border: `1px solid ${colors.border}`,
    overflow: "hidden",
  },
  tableContainer: {
    overflow: "auto",
  },
  tableCell: {
    fontSize: "14px",
    padding: "16px",
    borderBottom: `1px solid ${colors.border}`,
  },
  overdueChip: {
    backgroundColor: colors.errorLight,
    color: colors.errorDark,
    fontWeight: 700,
  },
  onTrackChip: {
    backgroundColor: colors.surfaceMuted,
    color: colors.textSecondary,
    fontWeight: 500,
  },
  inflowBadge: {
    color: colors.successDark,
    backgroundColor: colors.successLight,
    padding: "2px 8px",
    borderRadius: borderRadius.full,
    fontSize: "12px",
    fontWeight: 600,
  },
  outflowBadge: {
    color: colors.errorDark,
    backgroundColor: colors.errorLight,
    padding: "2px 8px",
    borderRadius: borderRadius.full,
    fontSize: "12px",
    fontWeight: 600,
  },
});
