import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Chip,
  Box,
  Divider,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import api from "../../../api/axios";
import { colors } from "../../../styles/theme";

const RecordPaymentModal = ({ open, onClose, targetData, onSuccess }) => {
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(dayjs());
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [bankAccountId, setBankAccountId] = useState("");
  const [bankAccounts, setBankAccounts] = useState([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchBankAccounts = async () => {
    try {
      const { data } = await api.get("/bank/accounts");
      setBankAccounts(data.data || []);
      if (data.data && data.data.length > 0) {
        const defaultAcc = data.data.find((a) => a.isDefault) || data.data[0];
        setBankAccountId(defaultAcc._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (open) {
      fetchBankAccounts();
    }
  }, [open]);

  useEffect(() => {
    if (open && targetData) {
      setAmount(targetData.remainingAmount || "");
      setPaymentDate(dayjs());
      setPaymentMethod("cash");
      setNotes("");
      setError("");
    }
  }, [open, targetData]);

  if (!targetData) return null;

  const isInflow = targetData.type === "inflow";
  const remaining = Number(targetData.remainingAmount || 0);

  const handleFullAmount = () => {
    setAmount(remaining.toString());
    setError("");
  };

  const handleAmountChange = (e) => {
    const val = e.target.value;
    setAmount(val);
    if (Number(val) <= 0) {
      setError("Amount must be greater than 0");
    } else if (Number(val) > remaining) {
      setError(`Amount cannot exceed outstanding balance of Rs. ${remaining}`);
    } else {
      setError("");
    }
  };

  const handleSubmit = async () => {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError("Please enter a valid payment amount");
      return;
    }
    if (numAmount > remaining) {
      setError(`Amount cannot exceed outstanding balance of Rs. ${remaining}`);
      return;
    }

    try {
      setLoading(true);
      await api.post("/payments", {
        type: targetData.type,
        partyId: targetData.partyId,
        partyType: targetData.partyType,
        relatedType: targetData.relatedType,
        relatedId: targetData.relatedId,
        referenceNumber: targetData.referenceNumber,
        paymentDate: paymentDate ? paymentDate.toDate() : new Date(),
        amount: numAmount,
        paymentMethod,
        bankAccountId: bankAccountId || undefined,
        notes,
      });

      toast.success(
        isInflow
          ? `Received Rs. ${numAmount} from ${targetData.partyName} successfully!`
          : `Paid Rs. ${numAmount} to ${targetData.partyName} successfully!`
      );

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: colors.textPrimary, borderBottom: `1px solid ${colors.border}`, pb: 2 }}>
        {isInflow ? "📥 Collect Customer Payment" : "📤 Pay Supplier / Miller"}
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        {/* Banner Info */}
        <Box
          sx={{
            backgroundColor: isInflow ? colors.infoLight : colors.warningLight,
            padding: "16px",
            borderRadius: "8px",
            marginBottom: "20px",
            borderLeft: `4px solid ${isInflow ? colors.infoDark : colors.warningDark}`,
          }}
        >
          <Grid container spacing={1} justifyContent="space-between" alignItems="center">
            <Grid item xs={12} sm={8}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: colors.textPrimary }}>
                {targetData.partyName}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Ref #: <strong>{targetData.referenceNumber || "N/A"}</strong>
                {targetData.itemName ? ` | Item: ${targetData.itemName}` : ""}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4} sx={{ textAlign: { xs: "left", sm: "right" } }}>
              <Chip
                label={`Due: Rs. ${remaining}`}
                sx={{
                  backgroundColor: colors.surface,
                  color: colors.error,
                  fontWeight: 700,
                  fontSize: "14px",
                  border: `1px solid ${colors.errorLight}`,
                }}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Quick Full Pay Action */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
          <Button
            size="small"
            variant="outlined"
            onClick={handleFullAmount}
            sx={{ textTransform: "none", fontWeight: 600, color: colors.primary, borderColor: colors.primary }}
          >
            Fill Full Balance (Rs. {remaining})
          </Button>
        </Box>

        <Grid container spacing={3}>
          {/* Amount Field */}
          <Grid item xs={12}>
            <TextField
              label="Payment Amount (Rs.) *"
              variant="outlined"
              fullWidth
              type="number"
              value={amount}
              onChange={handleAmountChange}
              error={!!error}
              helperText={error}
              required
              InputProps={{
                inputProps: { min: 1, max: remaining, step: "any" },
              }}
            />
          </Grid>

          {/* Bank Account Selector — only for supplier payments (outflow) */}
          {!isInflow && (
            <Grid item xs={12}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="bank-account-select-label">
                  Deduct From Bank / Cash Account
                </InputLabel>
                <Select
                  labelId="bank-account-select-label"
                  label="Deduct From Bank / Cash Account"
                  value={bankAccountId}
                  onChange={(e) => setBankAccountId(e.target.value)}
                >
                  {bankAccounts.length === 0 ? (
                    <MenuItem value="">Default Cash Account</MenuItem>
                  ) : (
                    bankAccounts.map((acc) => (
                      <MenuItem key={acc._id} value={acc._id}>
                        {acc.accountName} (Balance: Rs. {acc.currentBalance})
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>
          )}

          {/* Payment Date */}
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Payment Date"
                value={paymentDate}
                onChange={(date) => setPaymentDate(date)}
                slotProps={{ textField: { fullWidth: true, variant: "outlined" } }}
              />
            </LocalizationProvider>
          </Grid>

          {/* Payment Method */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="payment-method-label">Payment Method</InputLabel>
              <Select
                labelId="payment-method-label"
                value={paymentMethod}
                label="Payment Method"
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                <MenuItem value="cheque">Cheque</MenuItem>
                <MenuItem value="online">Online / UPI / Card</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Notes / Remarks */}
          <Grid item xs={12}>
            <TextField
              label="Transaction Notes / Cheque # / Bank Ref"
              variant="outlined"
              fullWidth
              multiline
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid via Meezan Online Transfer, Cheque #49281..."
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ padding: "16px 24px", borderTop: `1px solid ${colors.border}` }}>
        <Button onClick={onClose} disabled={loading} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !!error || !amount}
          disableElevation
          sx={{
            backgroundColor: isInflow ? colors.successDark : colors.secondary,
            color: colors.white,
            fontWeight: 700,
            "&:hover": {
              backgroundColor: isInflow ? colors.success : colors.secondaryLight,
            },
          }}
        >
          {loading ? "Recording..." : isInflow ? "Confirm Received" : "Confirm Payment"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RecordPaymentModal;
