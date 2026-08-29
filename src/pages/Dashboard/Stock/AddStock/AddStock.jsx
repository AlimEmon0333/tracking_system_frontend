import React, { useEffect, useState } from "react";
import {
  Button,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import ReceiptIcon from "@mui/icons-material/Receipt";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import api from "../../../../api/axios";
import { addStockStyle } from "./addStockStyles";

const AddStock = () => {
  const styles = addStockStyle();
  const navigate = useNavigate();

  const [millers, setMillers] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    date: dayjs(),
    millerId: "",
    itemName: "",
    totalQuantity: "",
    weightPerKatta: "",
    totalWeight: "",
    purchaseRate: "",
    totalAmount: "",
    remainingAmount: "",
    bhardanaRate: "",
    bhardana: "",
    paymentType: "cash",
    status: "unpaid",
    paidAmount: "",
    dueDays: "",
  });

  const fetchMillers = async () => {
    try {
      const { data } = await api.get("/stock/millers");
      setMillers(data.data);
    } catch (error) {
      toast.error("Failed to load millers");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => {
      const updatedForm = { ...prev, [name]: value };

      if (name === "totalQuantity" || name === "weightPerKatta") {
        updatedForm.totalWeight =
          Number(updatedForm.totalQuantity || 0) * Number(updatedForm.weightPerKatta || 0);
      }

      return updatedForm;
    });

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const purchaseAmount = Number(form.totalWeight || 0) * Number(form.purchaseRate || 0);
  const totalBhardana = Number(form.totalQuantity || 0) * Number(form.bhardanaRate || 0);
  const totalAmount = purchaseAmount + totalBhardana;

  const remainingQuantity = Number(form.totalQuantity || 0);
  const remainingWeight = Number(form.totalWeight || 0);

  const remainingAmount =
    form.status === "paid"
      ? 0
      : form.status === "partial"
        ? totalAmount - Number(form.paidAmount || 0)
        : totalAmount;

  const validate = () => {
    let temp = {};

    if (!form.date) temp.date = "Date is required";
    if (!form.millerId) temp.millerId = "Select Miller";
    if (!form.itemName.trim()) temp.itemName = "Item name is required";

    if (!form.totalQuantity) {
      temp.totalQuantity = "Enter Quantity";
    } else if (Number(form.totalQuantity) <= 0) {
      temp.totalQuantity = "Quantity must be > 0";
    }

    if (!form.weightPerKatta) {
      temp.weightPerKatta = "Enter weight";
    } else if (Number(form.weightPerKatta) <= 0) {
      temp.weightPerKatta = "Weight must be > 0";
    }

    if (!form.purchaseRate) {
      temp.purchaseRate = "Enter purchase rate";
    } else if (Number(form.purchaseRate) <= 0) {
      temp.purchaseRate = "Rate must be > 0";
    }

    if (!form.status) temp.status = "Select status";

    if (form.status === "partial") {
      if (!form.paidAmount || Number(form.paidAmount) <= 0) {
        temp.paidAmount = "Enter Paid Amount";
      } else if (Number(form.paidAmount) >= totalAmount) {
        temp.paidAmount = "Must be less than Total Amount";
      }
    }

    if (form.paymentType === "udhar") {
      if (!form.dueDays || Number(form.dueDays) <= 0) {
        temp.dueDays = "Enter valid Due Days";
      }
    }

    setErrors(temp);
    return Object.keys(temp).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.warning("Please fix the errors in the form");
      return;
    }

    try {
      setLoading(true);
      await api.post("/stock", {
        ...form,
        date: form.date.toDate(),
        totalAmount,
        bhardana: totalBhardana,
        remainingAmount,
        remainingQuantity,
        remainingWeight,
      });

      toast.success("Stock added successfully");
      setTimeout(() => navigate("/stocks"), 1000);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add stock");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMillers();
  }, []);

  return (
    <Box sx={styles.container}>
      <Box sx={styles.header}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/stocks")}>
            Back
          </Button>
          <Typography sx={styles.heading}>Add New Stock</Typography>
        </Box>
      </Box>

      <Box sx={styles.formLayout}>
        {/* Left Side: Form Details */}
        <Box sx={styles.formSection}>
          <Typography sx={styles.sectionTitle}>1. Supplier & Item Details</Typography>

          <Box sx={styles.gridRow}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DemoContainer components={["DatePicker"]} sx={{paddingTop:0}}>
                <DatePicker
                  // label="Purchase Date"
                  value={form.date}
                  onChange={(date) => {
                    setForm({ ...form, date });
                    if (errors.date) setErrors({ ...errors, date: "" });
                  }}
                  slotProps={{ textField: { fullWidth: true, error: !!errors.date, helperText: errors.date } }}
                />
              </DemoContainer>
            </LocalizationProvider>

            <FormControl error={!!errors.millerId} fullWidth >
              <InputLabel>Select Miller (Supplier)</InputLabel>
              <Select name="millerId" value={form.millerId} onChange={handleChange} label="Select Miller (Supplier)">
                {millers.map((m) => (
                  <MenuItem key={m._id} value={m._id}>{m.name}</MenuItem>
                ))}
              </Select>
              {errors.millerId && <FormHelperText>{errors.millerId}</FormHelperText>}
            </FormControl>
          </Box>

          <TextField
            label="Item Name"
            name="itemName"
            value={form.itemName}
            onChange={handleChange}
            error={!!errors.itemName}
            helperText={errors.itemName}
            fullWidth
          />

          <Box sx={styles.gridRow}>
            <TextField
              label="Total Quantity (Kattas)"
              name="totalQuantity"
              value={form.totalQuantity}
              onChange={handleChange}
              error={!!errors.totalQuantity}
              helperText={errors.totalQuantity}
              type="number"
              fullWidth
            />
            <TextField
              label="Weight per Katta (kg)"
              name="weightPerKatta"
              value={form.weightPerKatta}
              onChange={handleChange}
              error={!!errors.weightPerKatta}
              helperText={errors.weightPerKatta}
              type="number"
              fullWidth
            />
          </Box>

          <Box sx={styles.gridRow}>
            <TextField
              label="Purchase Rate (Rs per kg)"
              name="purchaseRate"
              value={form.purchaseRate}
              onChange={handleChange}
              error={!!errors.purchaseRate}
              helperText={errors.purchaseRate}
              type="number"
              fullWidth
            />
            <TextField
              label="Calculated Weight (kg)"
              name="totalWeight"
              value={form.totalWeight}
              InputProps={{ readOnly: true }}
              helperText="Auto-calculated (Qty × Weight/Katta)"
              type="number"
              fullWidth
            />
          </Box>

          <TextField
            label="Bhardana Rate (Optional)"
            name="bhardanaRate"
            value={form.bhardanaRate}
            onChange={handleChange}
            error={!!errors.bhardanaRate}
            helperText={errors.bhardanaRate}
            type="number"
            fullWidth
          />

          <Typography sx={styles.sectionTitle} mt={2}>2. Payment Details</Typography>

          <Box sx={styles.gridRow}>
            <FormControl fullWidth>
              <InputLabel>Payment Type</InputLabel>
              <Select name="paymentType" value={form.paymentType} onChange={handleChange} label="Payment Type">
                <MenuItem value="cash">Cash / Bank Transfer</MenuItem>
                <MenuItem value="udhar">Udhar (Credit)</MenuItem>
              </Select>
            </FormControl>

            <FormControl error={!!errors.status} fullWidth>
              <InputLabel>Payment Status</InputLabel>
              <Select name="status" value={form.status} onChange={handleChange} label="Payment Status">
                <MenuItem value="paid">Fully Paid</MenuItem>
                <MenuItem value="partial">Partial Payment</MenuItem>
                <MenuItem value="unpaid">Unpaid</MenuItem>
              </Select>
              {errors.status && <FormHelperText>{errors.status}</FormHelperText>}
            </FormControl>
          </Box>

          <Box sx={styles.gridRow}>
            {form.paymentType === "udhar" && (
              <TextField
                label="Due In (Days)"
                name="dueDays"
                value={form.dueDays}
                onChange={handleChange}
                error={!!errors.dueDays}
                helperText={errors.dueDays}
                type="number"
                fullWidth
              />
            )}

            {form.status === "partial" && (
              <TextField
                label="Paid Amount (Rs)"
                name="paidAmount"
                value={form.paidAmount}
                onChange={handleChange}
                error={!!errors.paidAmount}
                helperText={errors.paidAmount}
                type="number"
                fullWidth
              />
            )}
          </Box>
        </Box>

        {/* Right Side: Live Receipt Summary */}
        <Box sx={styles.summarySection}>
          <Typography sx={styles.summaryTitle}>
            <ReceiptIcon color="secondary" /> Purchase Summary
          </Typography>

          <Box sx={styles.billSummaryDetails}>
            <Box sx={styles.billSummaryDetail}>
              <Typography>Total Items</Typography>
              <Typography sx={styles.detailValue}>{form.totalQuantity || 0} Qty</Typography>
            </Box>
            <Box sx={styles.billSummaryDetail}>
              <Typography>Total Weight</Typography>
              <Typography sx={styles.detailValue}>{form.totalWeight || 0} kg</Typography>
            </Box>
            <Box sx={styles.billSummaryDetail}>
              <Typography>Purchase Rate</Typography>
              <Typography sx={styles.detailValue}>Rs. {form.purchaseRate || 0} / kg</Typography>
            </Box>
            <Box sx={styles.billSummaryDetail}>
              <Typography>Gross Amount</Typography>
              <Typography sx={styles.detailValue}>Rs. {purchaseAmount.toLocaleString()}</Typography>
            </Box>
            <Box sx={styles.billSummaryDetail}>
              <Typography>Bhardana Charges</Typography>
              <Typography sx={styles.detailValue}>+ Rs. {totalBhardana.toLocaleString()}</Typography>
            </Box>

            <Box sx={styles.totalRow}>
              <Typography variant="h6">Total Payable</Typography>
              <Typography variant="h6">Rs. {totalAmount.toLocaleString()}</Typography>
            </Box>

            {form.status === "partial" && (
              <Box sx={{ ...styles.billSummaryDetail, borderBottom: 'none', mt: 1 }}>
                <Typography color="success.main">Paid Amount</Typography>
                <Typography sx={{ ...styles.detailValue, color: 'success.main' }}>- Rs. {Number(form.paidAmount || 0).toLocaleString()}</Typography>
              </Box>
            )}

            {(form.status === "partial" || form.status === "unpaid") && (
              <Box sx={{ ...styles.totalRow, borderTop: 'none', paddingTop: 0, marginTop: 0, color: 'text.primary' }}>
                <Typography variant="subtitle1" fontWeight={600}>Remaining Balance</Typography>
                <Typography variant="subtitle1" fontWeight={700} color="error.main">Rs. {remainingAmount.toLocaleString()}</Typography>
              </Box>
            )}
          </Box>

          <Button
            variant="contained"
            color="secondary"
            sx={styles.button}
            onClick={handleSubmit}
            disabled={loading}
            fullWidth
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Save & Add Stock"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default AddStock;
