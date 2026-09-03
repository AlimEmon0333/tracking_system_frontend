import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  useMediaQuery,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import LocalPhoneIcon from "@mui/icons-material/LocalPhone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CallReceivedIcon from "@mui/icons-material/CallReceived";
import CallMadeIcon from "@mui/icons-material/CallMade";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { colors, borderRadius, shadows, SmallMobileView } from "../../../../styles/theme";
import api from "../../../../api/axios";

const StatCard = ({ label, value, color, bg }) => (
  <Paper
    sx={{
      padding: "20px 24px",
      borderRadius: borderRadius.lg,
      backgroundColor: bg || colors.surfaceMuted,
      boxShadow: shadows.sm,
      flex: "1 1 160px",
      minWidth: "140px",
    }}
  >
    <Typography
      sx={{ fontSize: "12px", fontWeight: 700, color: colors.textSecondary, textTransform: "uppercase", mb: 0.5 }}
    >
      {label}
    </Typography>
    <Typography sx={{ fontSize: "20px", fontWeight: 800, color: color || colors.textPrimary }}>
      Rs. {(value || 0).toLocaleString()}
    </Typography>
  </Paper>
);

const PartyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const mobileView = useMediaQuery(SmallMobileView);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // Payment history search
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentDateFilter, setPaymentDateFilter] = useState("");

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const { data: res } = await api.get(`/party/${id}/details`);
        setData(res.data);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to fetch party details");
        navigate("/parties");
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data) return null;

  const { party, financials, sales, stocks, payments } = data;
  const isBuyer = party.type?.toLowerCase() === "buyer";
  const isMiller = party.type?.toLowerCase() === "miller";

  // Filter payments for history tab
  const filteredPayments = payments.filter((p) => {
    const partyNameMatch = p.partyId?.name?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
      p.referenceNumber?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
      p.notes?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
      paymentSearch === "";

    const dateMatch = paymentDateFilter
      ? new Date(p.paymentDate).toLocaleDateString("en-CA") === paymentDateFilter
      : true;

    return partyNameMatch && dateMatch;
  });

  return (
    <Box sx={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/parties")}
          sx={{ textTransform: "none", color: colors.textSecondary }}
        >
          Back to Parties
        </Button>
        <Box>
          <Typography sx={{ fontSize: "24px", fontWeight: 800, color: colors.textPrimary }}>
            {party.name}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mt: 0.5 }}>
            <Chip
              label={party.type}
              size="small"
              sx={{
                backgroundColor: isBuyer ? colors.infoLight : colors.warningLight,
                color: isBuyer ? colors.infoDark : colors.warningDark,
                fontWeight: 700,
                fontSize: "11px",
              }}
            />
            {party.phone && (
              <Typography variant="body2" sx={{ color: colors.textSecondary, display: "flex", alignItems: "center", gap: 0.5 }}>
                <LocalPhoneIcon fontSize="inherit" /> {party.phone}
              </Typography>
            )}
            {party.address && (
              <Typography variant="body2" sx={{ color: colors.textSecondary, display: "flex", alignItems: "center", gap: 0.5 }}>
                <LocationOnIcon fontSize="inherit" /> {party.address}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Financial Summary Cards */}
      {isBuyer && (
        <>
          <Typography sx={{ fontWeight: 700, fontSize: "14px", color: colors.textSecondary, mb: 1, textTransform: "uppercase" }}>
            Sales Summary
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
            <StatCard label="Total Sales" value={financials.totalSales} color={colors.infoDark} bg={colors.infoLight} />
            <StatCard label="Total Profit" value={financials.totalProfit} color={colors.successDark} bg={colors.successLight} />
            <StatCard label="Total Collected" value={financials.totalSalesCollected} color={colors.successDark} bg={colors.successLight} />
            <StatCard label="Remaining Amount" value={financials.totalSalesRemaining} color={financials.totalSalesRemaining > 0 ? colors.errorDark : colors.successDark} bg={financials.totalSalesRemaining > 0 ? colors.errorLight : colors.successLight} />
          </Box>
        </>
      )}

      {isMiller && (
        <>
          <Typography sx={{ fontWeight: 700, fontSize: "14px", color: colors.textSecondary, mb: 1, textTransform: "uppercase" }}>
            Purchase Summary
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
            <StatCard label="Total Purchases" value={financials.totalPurchases} color={colors.warningDark} bg={colors.warningLight} />
            <StatCard label="Total Paid" value={financials.totalPurchasesPaid} color={colors.successDark} bg={colors.successLight} />
            <StatCard label="Remaining Payable" value={financials.totalPurchasesRemaining} color={financials.totalPurchasesRemaining > 0 ? colors.errorDark : colors.successDark} bg={financials.totalPurchasesRemaining > 0 ? colors.errorLight : colors.successLight} />
          </Box>
        </>
      )}

      {/* Payments Summary */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
        <StatCard label="Total Cash Received" value={financials.totalPaymentsIn} color={colors.successDark} bg={colors.successLight} />
        <StatCard label="Total Cash Paid" value={financials.totalPaymentsOut} color={colors.textPrimary} bg={colors.surfaceMuted} />
      </Box>

      {/* Tabs */}
      <Paper sx={{ borderRadius: borderRadius.lg, boxShadow: shadows.sm, border: `1px solid ${colors.border}` }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          textColor="primary"
          indicatorColor="primary"
          sx={{ borderBottom: `1px solid ${colors.border}` }}
        >
          {isBuyer && <Tab label={`📋 Sales (${sales.length})`} sx={{ fontWeight: 600, textTransform: "none" }} />}
          {isMiller && <Tab label={`📦 Purchases (${stocks.length})`} sx={{ fontWeight: 600, textTransform: "none" }} />}
          <Tab label={`💳 Payments (${payments.length})`} sx={{ fontWeight: 600, textTransform: "none" }} />
        </Tabs>

        {/* Sales Tab */}
        {isBuyer && activeTab === 0 && (
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: colors.surfaceMuted }}>
                  <TableCell sx={{ fontWeight: 700 }}>Bill #</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Paid</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Remaining</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Profit</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4, color: colors.textSecondary }}>
                      No sales found for this party.
                    </TableCell>
                  </TableRow>
                ) : (
                  sales.map((s) => (
                    <TableRow key={s._id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>#{s.billNumber}</TableCell>
                      <TableCell>{new Date(s.date).toLocaleDateString()}</TableCell>
                      <TableCell>{s.itemName}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Rs. {s.totalAmount?.toLocaleString()}</TableCell>
                      <TableCell sx={{ color: colors.successDark, fontWeight: 600 }}>Rs. {s.paidAmount?.toLocaleString()}</TableCell>
                      <TableCell sx={{ color: s.remainingAmount > 0 ? colors.errorDark : colors.successDark, fontWeight: 700 }}>
                        Rs. {s.remainingAmount?.toLocaleString()}
                      </TableCell>
                      <TableCell sx={{ color: colors.successDark, fontWeight: 600 }}>Rs. {s.profit?.toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={s.status}
                          size="small"
                          sx={{
                            backgroundColor:
                              s.status === "paid" ? colors.successLight :
                              s.status === "partial" ? colors.warningLight : colors.errorLight,
                            color:
                              s.status === "paid" ? colors.successDark :
                              s.status === "partial" ? colors.warningDark : colors.errorDark,
                            fontWeight: 700,
                            textTransform: "capitalize",
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Purchases Tab */}
        {isMiller && activeTab === 0 && (
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: colors.surfaceMuted }}>
                  <TableCell sx={{ fontWeight: 700 }}>Receipt #</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Paid</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Remaining</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stocks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4, color: colors.textSecondary }}>
                      No purchases found for this party.
                    </TableCell>
                  </TableRow>
                ) : (
                  stocks.map((s) => (
                    <TableRow key={s._id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>#{s.receiptNumber}</TableCell>
                      <TableCell>{new Date(s.date).toLocaleDateString()}</TableCell>
                      <TableCell>{s.itemName}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Rs. {s.totalAmount?.toLocaleString()}</TableCell>
                      <TableCell sx={{ color: colors.successDark, fontWeight: 600 }}>Rs. {s.paidAmount?.toLocaleString()}</TableCell>
                      <TableCell sx={{ color: s.remainingAmount > 0 ? colors.errorDark : colors.successDark, fontWeight: 700 }}>
                        Rs. {s.remainingAmount?.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={s.remainingAmount > 0 ? (s.paidAmount > 0 ? "Partial" : "Unpaid") : "Settled"}
                          size="small"
                          sx={{
                            backgroundColor:
                              s.remainingAmount <= 0 ? colors.successLight :
                              s.paidAmount > 0 ? colors.warningLight : colors.errorLight,
                            color:
                              s.remainingAmount <= 0 ? colors.successDark :
                              s.paidAmount > 0 ? colors.warningDark : colors.errorDark,
                            fontWeight: 700,
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Payments Tab */}
        {((isBuyer && activeTab === 1) || (isMiller && activeTab === 1) || (!isBuyer && !isMiller && activeTab === 0)) && (
          <Box>
            {/* Payments Search */}
            <Box sx={{ p: 2, display: "flex", gap: 2, flexWrap: "wrap", borderBottom: `1px solid ${colors.border}` }}>
              <TextField
                placeholder="Search by reference, notes..."
                value={paymentSearch}
                onChange={(e) => setPaymentSearch(e.target.value)}
                size="small"
                sx={{ minWidth: "220px", flex: 1 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: colors.textSecondary, fontSize: "18px" }} />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                type="date"
                value={paymentDateFilter}
                onChange={(e) => setPaymentDateFilter(e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: "170px" }}
              />
              {(paymentSearch || paymentDateFilter) && (
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  onClick={() => { setPaymentSearch(""); setPaymentDateFilter(""); }}
                  sx={{ textTransform: "none" }}
                >
                  Clear
                </Button>
              )}
            </Box>

            <TableContainer sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: colors.surfaceMuted }}>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Reference</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Method</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4, color: colors.textSecondary }}>
                        {paymentSearch || paymentDateFilter ? "No payments match the search/filter." : "No payments recorded."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map((p) => {
                      const isInflow = p.type === "inflow";
                      return (
                        <TableRow key={p._id} hover>
                          <TableCell>{new Date(p.paymentDate).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              {isInflow ? (
                                <CallReceivedIcon sx={{ color: colors.successDark, fontSize: "16px" }} />
                              ) : (
                                <CallMadeIcon sx={{ color: colors.textPrimary, fontSize: "16px" }} />
                              )}
                              <Chip
                                label={isInflow ? "Received" : "Paid"}
                                size="small"
                                sx={{
                                  backgroundColor: isInflow ? colors.successLight : colors.surfaceMuted,
                                  color: isInflow ? colors.successDark : colors.textPrimary,
                                  fontWeight: 700,
                                  fontSize: "11px",
                                }}
                              />
                            </Box>
                          </TableCell>
                          <TableCell sx={{ color: colors.textSecondary, fontSize: "13px" }}>
                            {p.referenceNumber || "-"}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, color: isInflow ? colors.successDark : colors.textPrimary }}>
                            Rs. {p.amount?.toLocaleString()}
                          </TableCell>
                          <TableCell sx={{ textTransform: "capitalize" }}>
                            {p.paymentMethod?.replace("_", " ")}
                          </TableCell>
                          <TableCell sx={{ color: colors.textSecondary, maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {p.notes || "-"}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default PartyDetails;
