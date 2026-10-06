import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Collapse,
  Divider,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PaymentsIcon from "@mui/icons-material/Payments";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ListAltIcon from "@mui/icons-material/ListAlt";

import { colors, borderRadius, shadows } from "../../styles/theme";
import api from "../../api/axios";

/* ─────────────────────────────────────────────
   Helper utilities
───────────────────────────────────────────── */
const fmt = (n) => Number(n || 0).toLocaleString();

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const StatusChip = ({ status }) => {
  const isPaid = status === "paid";
  const isPartial = status === "partial";
  return (
    <Chip
      icon={
        isPaid ? (
          <CheckCircleIcon style={{ fontSize: "13px", color: colors.successDark }} />
        ) : (
          <HourglassTopIcon style={{ fontSize: "13px", color: colors.warningDark }} />
        )
      }
      label={isPaid ? "Fully Settled" : isPartial ? "Partially Paid" : "Unpaid"}
      size="small"
      sx={{
        fontWeight: 700,
        fontSize: "11px",
        backgroundColor: isPaid
          ? colors.successLight
          : isPartial
          ? colors.warningLight
          : colors.errorLight,
        color: isPaid
          ? colors.successDark
          : isPartial
          ? colors.warningDark
          : colors.errorDark,
      }}
    />
  );
};

/* ─────────────────────────────────────────────
   Tab 1 – Flat list of all individual payments
───────────────────────────────────────────── */
const FlatPaymentsTab = ({ payments, sales, searchTerm, dateFilter, onOpenReceipt }) => {
  const buyerPayments = useMemo(
    () =>
      payments
        .filter((p) => p.type === "inflow")
        .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate)),
    [payments]
  );

  const salesMap = useMemo(() => {
    const map = new Map();
    sales.forEach((s) => {
      map.set(String(s._id), s);
      if (s.billNumber) map.set(String(s.billNumber), s);
    });
    return map;
  }, [sales]);

  const enriched = useMemo(
    () =>
      buyerPayments.map((p) => {
        let linkedSale =
          salesMap.get(String(p.relatedId)) ||
          salesMap.get(String(p.referenceNumber)) ||
          null;
        const isAuto =
          p.isAutoAllocation ||
          (p.notes || "").toLowerCase().includes("fifo") ||
          (p.notes || "").toLowerCase().includes("auto-allocated");
        return {
          ...p,
          linkedSale,
          isAuto,
          billTotal: linkedSale ? Number(linkedSale.totalAmount || 0) : null,
          billRemaining: linkedSale ? Number(linkedSale.remainingAmount || 0) : null,
          billStatus: linkedSale ? linkedSale.status : "unknown",
        };
      }),
    [buyerPayments, salesMap]
  );

  const filtered = useMemo(
    () =>
      enriched.filter((p) => {
        const s = searchTerm.toLowerCase();
        const matchSearch =
          !s ||
          (p.referenceNumber && p.referenceNumber.toLowerCase().includes(s)) ||
          (p.notes && p.notes.toLowerCase().includes(s)) ||
          (p.paymentMethod && p.paymentMethod.toLowerCase().includes(s)) ||
          (p.linkedSale?.itemName && p.linkedSale.itemName.toLowerCase().includes(s));
        const matchDate =
          !dateFilter ||
          new Date(p.paymentDate).toLocaleDateString("en-CA") === dateFilter;
        return matchSearch && matchDate;
      }),
    [enriched, searchTerm, dateFilter]
  );

  return (
    <TableContainer
      component={Paper}
      sx={{
        borderRadius: borderRadius.md,
        border: `1px solid ${colors.border}`,
        boxShadow: shadows.xs,
        overflowX: "auto",
      }}
    >
      <Table size="small">
        <TableHead>
          <TableRow sx={{ backgroundColor: colors.surfaceMuted }}>
            <TableCell sx={{ fontWeight: 700 }}>Payment Date</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Allocated Bill #</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Bill Total</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Status After</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Remaining</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Method / Notes</TableCell>
            {onOpenReceipt && (
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                Voucher
              </TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} align="center" sx={{ py: 6, color: colors.textSecondary }}>
                {searchTerm || dateFilter
                  ? "No payment records match your filter."
                  : "No cash collection records found for this buyer."}
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((p) => (
              <TableRow key={p._id} hover sx={{ "&:hover": { backgroundColor: "#F1F5F9" } }}>
                <TableCell sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                    <CalendarTodayIcon sx={{ fontSize: "14px", color: colors.textSecondary }} />
                    {fmtDate(p.paymentDate)}
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 800, color: colors.successDark, whiteSpace: "nowrap" }}>
                  Rs. {fmt(p.amount)}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    {p.referenceNumber ? (
                      <Chip
                        icon={<ReceiptLongIcon style={{ fontSize: "13px", color: colors.primary }} />}
                        label={`#${p.referenceNumber}`}
                        size="small"
                        sx={{ fontWeight: 700, fontSize: "12px", bgcolor: colors.infoLight, color: colors.primary }}
                      />
                    ) : (
                      <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                        General Inflow
                      </Typography>
                    )}
                    {p.isAuto && (
                      <Tooltip title="Auto-allocated via FIFO">
                        <Chip
                          label="FIFO"
                          size="small"
                          sx={{ fontSize: "10px", height: "18px", bgcolor: "#E0E7FF", color: "#3730A3", fontWeight: 800 }}
                        />
                      </Tooltip>
                    )}
                  </Box>
                  {p.linkedSale?.itemName && (
                    <Typography variant="caption" sx={{ display: "block", color: colors.textSecondary, mt: 0.3 }}>
                      {p.linkedSale.itemName}
                    </Typography>
                  )}
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  {p.billTotal != null ? `Rs. ${fmt(p.billTotal)}` : "—"}
                </TableCell>
                <TableCell>
                  {p.linkedSale ? (
                    <StatusChip status={p.billStatus} />
                  ) : (
                    <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                      Account Credit
                    </Typography>
                  )}
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>
                  {p.billRemaining != null ? (
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 700, color: p.billRemaining > 0 ? colors.errorDark : colors.successDark }}
                    >
                      Rs. {fmt(p.billRemaining)}
                    </Typography>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell sx={{ maxWidth: "200px" }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "capitalize", color: colors.textPrimary, display: "block" }}>
                    {p.paymentMethod?.replace("_", " ") || "Cash"}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: colors.textSecondary, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  >
                    {p.notes || "—"}
                  </Typography>
                </TableCell>
                {onOpenReceipt && (
                  <TableCell align="right">
                    <Tooltip title="View / Print Payment Voucher">
                      <IconButton
                        size="small"
                        onClick={() => onOpenReceipt(p, "payment")}
                        sx={{ color: colors.primary, bgcolor: colors.surfaceMuted, "&:hover": { bgcolor: colors.infoLight } }}
                      >
                        <ReceiptLongIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

/* ─────────────────────────────────────────────
   Tab 2 – Hierarchical FIFO Auto-payment groups
───────────────────────────────────────────── */
const AutoGroupCard = ({ group, index }) => {
  const [open, setOpen] = useState(index === 0); // first card expanded by default

  const settledCount = group.allocations.filter((a) => a.isFullySettled).length;
  const partialCount = group.allocations.filter((a) => !a.isFullySettled).length;

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: borderRadius.md,
        overflow: "hidden",
        border: `1px solid ${colors.border}`,
        mb: 2,
      }}
    >
      {/* Card Header */}
      <Box
        onClick={() => setOpen((v) => !v)}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
          cursor: "pointer",
          backgroundColor: colors.surfaceMuted,
          "&:hover": { backgroundColor: "#EFF6FF" },
          transition: "background-color 0.15s",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "10px",
              bgcolor: "#DBEAFE",
              color: "#1D4ED8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <AutoAwesomeIcon fontSize="small" />
          </Box>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Typography variant="body1" sx={{ fontWeight: 800, color: colors.textPrimary }}>
                Auto Payment — Rs. {fmt(group.totalAmount)}
              </Typography>
              <Chip
                label="FIFO"
                size="small"
                sx={{ fontSize: "10px", height: "18px", bgcolor: "#E0E7FF", color: "#3730A3", fontWeight: 800 }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: colors.textSecondary }}>
              {fmtDateTime(group.paymentDate)} &nbsp;•&nbsp;
              {group.paymentMethod?.replace("_", " ") || "Cash"} &nbsp;•&nbsp;
              {group.allocations.length} bill(s) covered
              {settledCount > 0 && ` (${settledCount} fully settled`}
              {partialCount > 0 && `, ${partialCount} partial`}
              {settledCount > 0 && ")"}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {group.remainingAfter > 0 && (
            <Chip
              label={`Rs. ${fmt(group.remainingAfter)} unused`}
              size="small"
              sx={{ bgcolor: colors.warningLight, color: colors.warningDark, fontWeight: 700 }}
            />
          )}
          <IconButton size="small" sx={{ color: colors.textSecondary }}>
            {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </Box>

      {/* Expanded Breakdown */}
      <Collapse in={open}>
        <Divider />
        <Box sx={{ p: 2, backgroundColor: "#FAFBFF" }}>
          {group.notes && (
            <Typography variant="caption" sx={{ color: colors.textSecondary, mb: 1.5, display: "block" }}>
              Note: {group.notes}
            </Typography>
          )}

          {/* Summary row */}
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
            <Box sx={{ p: 1.5, borderRadius: borderRadius.sm, bgcolor: colors.successLight, flex: 1, minWidth: "120px" }}>
              <Typography variant="caption" sx={{ color: colors.successDark, fontWeight: 700, textTransform: "uppercase" }}>
                Total Entered
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, color: colors.successDark }}>
                Rs. {fmt(group.totalAmount)}
              </Typography>
            </Box>
            <Box sx={{ p: 1.5, borderRadius: borderRadius.sm, bgcolor: colors.infoLight, flex: 1, minWidth: "120px" }}>
              <Typography variant="caption" sx={{ color: colors.infoDark, fontWeight: 700, textTransform: "uppercase" }}>
                Bills Covered
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, color: colors.infoDark }}>
                {group.allocations.length}
              </Typography>
            </Box>
            {group.remainingAfter > 0 && (
              <Box sx={{ p: 1.5, borderRadius: borderRadius.sm, bgcolor: colors.warningLight, flex: 1, minWidth: "120px" }}>
                <Typography variant="caption" sx={{ color: colors.warningDark, fontWeight: 700, textTransform: "uppercase" }}>
                  Remaining
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: colors.warningDark }}>
                  Rs. {fmt(group.remainingAfter)}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Allocation Breakdown Table */}
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: borderRadius.sm }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#F1F5FF" }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: "12px" }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "12px" }}>Bill #</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "12px" }}>Item</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "12px" }}>Bill Total</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "12px" }}>Amount Applied</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "12px" }}>Remaining After</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "12px" }}>Result</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {group.allocations.map((alloc, idx) => (
                  <TableRow
                    key={idx}
                    sx={{
                      backgroundColor: alloc.isFullySettled ? "#F0FDF4" : "#FFFBEB",
                      "&:hover": { filter: "brightness(0.97)" },
                    }}
                  >
                    <TableCell sx={{ fontWeight: 700, color: colors.textSecondary, fontSize: "12px" }}>
                      {idx + 1}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<ReceiptLongIcon style={{ fontSize: "12px", color: colors.primary }} />}
                        label={`#${alloc.referenceNumber || "—"}`}
                        size="small"
                        sx={{ fontWeight: 700, fontSize: "11px", bgcolor: colors.infoLight, color: colors.primary }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: "12px", color: colors.textSecondary }}>
                      {alloc.itemName || "—"}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "12px" }}>
                      Rs. {fmt(alloc.billTotal)}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, color: colors.successDark, fontSize: "12px" }}>
                      Rs. {fmt(alloc.amountAllocated)}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "12px" }}>
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 700, color: alloc.newRemainingAmount > 0 ? colors.errorDark : colors.successDark }}
                      >
                        Rs. {fmt(alloc.newRemainingAmount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <StatusChip status={alloc.statusAfter} />
                    </TableCell>
                  </TableRow>
                ))}

                {/* Totals row */}
                <TableRow sx={{ backgroundColor: "#F8FAFC", borderTop: `2px solid ${colors.border}` }}>
                  <TableCell colSpan={4} sx={{ fontWeight: 800, fontSize: "12px" }}>
                    TOTAL
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800, color: colors.successDark, fontSize: "12px" }}>
                    Rs. {fmt(group.allocations.reduce((s, a) => s + Number(a.amountAllocated || 0), 0))}
                  </TableCell>
                  <TableCell colSpan={2} />
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Collapse>
    </Paper>
  );
};

const AutoGroupsTab = ({ partyId, searchTerm, dateFilter }) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!partyId) return;
    setLoading(true);
    api
      .get(`/payments/auto-groups?partyId=${partyId}`)
      .then((res) => {
        setGroups(res.data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Failed to load auto-payment groups.");
        setLoading(false);
      });
  }, [partyId]);

  const filtered = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return groups.filter((g) => {
      const matchSearch =
        !s ||
        g.allocations.some(
          (a) =>
            (a.referenceNumber && a.referenceNumber.toLowerCase().includes(s)) ||
            (a.itemName && a.itemName.toLowerCase().includes(s))
        ) ||
        (g.notes && g.notes.toLowerCase().includes(s));
      const matchDate =
        !dateFilter ||
        new Date(g.paymentDate).toLocaleDateString("en-CA") === dateFilter;
      return matchSearch && matchDate;
    });
  }, [groups, searchTerm, dateFilter]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: "center", color: colors.errorDark }}>
        <Typography variant="body2">{error}</Typography>
      </Box>
    );
  }

  if (filtered.length === 0) {
    return (
      <Box
        sx={{
          py: 6,
          textAlign: "center",
          color: colors.textSecondary,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1,
        }}
      >
        <AutoAwesomeIcon sx={{ fontSize: 40, opacity: 0.3 }} />
        <Typography variant="body2">
          {searchTerm || dateFilter
            ? "No auto-payment groups match your filter."
            : "No FIFO auto-payment groups recorded yet."}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {filtered.map((g, idx) => (
        <AutoGroupCard key={g._id} group={g} index={idx} />
      ))}
    </Box>
  );
};

/* ─────────────────────────────────────────────
   Main Modal
───────────────────────────────────────────── */
const BuyerPaymentHistoryModal = ({
  open,
  onClose,
  party,
  sales = [],
  payments = [],
  financials = {},
  onOpenReceipt,
}) => {
  const [tab, setTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const totalCollected = Number(financials.totalSalesCollected || 0);
  const totalSales = Number(financials.totalSales || 0);
  const totalRemaining = Number(financials.totalSalesRemaining || 0);
  const totalPayments = payments.filter((p) => p.type === "inflow").length;

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: borderRadius.lg,
          boxShadow: shadows.lg,
          overflow: "hidden",
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          backgroundColor: colors.surfaceMuted,
          borderBottom: `1px solid ${colors.border}`,
          padding: "16px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "10px",
              backgroundColor: colors.successLight,
              color: colors.successDark,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PaymentsIcon fontSize="medium" />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: colors.textPrimary, lineHeight: 1.2 }}>
              Buyer Payment & Allocation History
            </Typography>
            <Typography variant="caption" sx={{ color: colors.textSecondary }}>
              Party: <strong>{party?.name}</strong> • Complete Cash Collection & Bill Allocation Breakdown
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: colors.textSecondary }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, backgroundColor: "#F8FAFC" }}>
        {/* Summary Cards */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", sm: "1fr 1fr 1fr 1fr" },
            gap: 2,
            mb: 3,
          }}
        >
          {[
            { label: "Total Collected", value: `Rs. ${fmt(totalCollected)}`, bg: colors.successLight, color: colors.successDark },
            { label: "Total Invoiced", value: `Rs. ${fmt(totalSales)}`, bg: colors.infoLight, color: colors.infoDark },
            {
              label: "Remaining Balance",
              value: `Rs. ${fmt(totalRemaining)}`,
              bg: totalRemaining > 0 ? colors.errorLight : colors.successLight,
              color: totalRemaining > 0 ? colors.errorDark : colors.successDark,
            },
            { label: "Total Receipts", value: `${totalPayments} Payments`, bg: colors.surface, color: colors.textPrimary },
          ].map((card) => (
            <Paper key={card.label} sx={{ p: 2, borderRadius: borderRadius.md, backgroundColor: card.bg, border: `1px solid ${colors.border}` }}>
              <Typography variant="caption" sx={{ color: card.color, fontWeight: 700, textTransform: "uppercase" }}>
                {card.label}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: card.color, mt: 0.5 }}>
                {card.value}
              </Typography>
            </Paper>
          ))}
        </Box>

        {/* Filters */}
        <Paper
          sx={{
            p: 1.5,
            mb: 2,
            display: "flex",
            gap: 2,
            alignItems: "center",
            flexWrap: "wrap",
            borderRadius: borderRadius.md,
            border: `1px solid ${colors.border}`,
          }}
        >
          <TextField
            placeholder="Search by Bill #, item, method, notes..."
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flex: 1, minWidth: "220px" }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: colors.textSecondary }} />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            type="date"
            label="Filter Payment Date"
            size="small"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: "170px" }}
          />
          {(searchTerm || dateFilter) && (
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              onClick={() => { setSearchTerm(""); setDateFilter(""); }}
              sx={{ textTransform: "none" }}
            >
              Clear
            </Button>
          )}
        </Paper>

        {/* Tabs */}
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ mb: 2, borderBottom: `1px solid ${colors.border}` }}
        >
          <Tab
            icon={<ListAltIcon sx={{ fontSize: "18px" }} />}
            iconPosition="start"
            label="All Payments"
            sx={{ textTransform: "none", fontWeight: 600, minHeight: 40 }}
          />
          <Tab
            icon={<AutoAwesomeIcon sx={{ fontSize: "18px" }} />}
            iconPosition="start"
            label="FIFO Auto-Payment Groups"
            sx={{ textTransform: "none", fontWeight: 600, minHeight: 40 }}
          />
        </Tabs>

        {tab === 0 && (
          <FlatPaymentsTab
            payments={payments}
            sales={sales}
            searchTerm={searchTerm}
            dateFilter={dateFilter}
            onOpenReceipt={onOpenReceipt}
          />
        )}
        {tab === 1 && (
          <AutoGroupsTab
            partyId={party?._id}
            searchTerm={searchTerm}
            dateFilter={dateFilter}
          />
        )}

        {/* Footer info */}
        <Box
          sx={{
            mt: 2.5,
            p: 2,
            borderRadius: borderRadius.md,
            backgroundColor: "#EFF6FF",
            border: "1px solid #BFDBFE",
            display: "flex",
            alignItems: "flex-start",
            gap: 1.5,
          }}
        >
          <AccountBalanceWalletIcon sx={{ color: colors.primary, mt: 0.2 }} fontSize="small" />
          <Typography variant="caption" sx={{ color: "#1E40AF", lineHeight: 1.5 }}>
            <strong>How Payment Allocation Works:</strong> The <em>All Payments</em> tab lists every
            individual payment record. The <em>FIFO Auto-Payment Groups</em> tab shows each auto-payment
            event as a single collapsed card — expand it to see exactly which bills were settled,
            how much was applied to each, and what balance remained after the payment.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, px: 3, borderTop: `1px solid ${colors.border}`, backgroundColor: colors.surfaceMuted }}>
        <Button onClick={onClose} variant="contained" color="inherit" sx={{ textTransform: "none", fontWeight: 600 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BuyerPaymentHistoryModal;
