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
import { createInvoiceStyles } from "./createInvoiceStyle";

const CreateInvoice = () => {
  const styles = createInvoiceStyles();
  const navigate = useNavigate();

  const [buyers, setBuyers] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    date: dayjs(),
    buyerId: "",
    stockId: "",
    paymentType: "cash",
    status: "unpaid",
    quantity: "",
    weight: "",
    rate: "",
    purchaseRate: "",
    totalAmount: "",
    bhardanaRate: "",
    bhardana: "",
    profit: "",
    paidAmount: "",
    remainingAmount: "",
    dueDays: "",
  });

  const fetchBuyers = async () => {
    try {
      const { data } = await api.get("/sales/buyers");
      setBuyers(data.data || []);
    } catch (error) {
      toast.error("Failed to load buyers");
    }
  };

  const fetchStocks = async () => {
    try {
      const { data } = await api.get("/stock/stocks");
      setStocks((data.data || []).filter((stock) => stock.remainingQuantity > 0));
    } catch (error) {
      toast.error("Failed to load stocks");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => {
      const updated = { ...prev, [name]: value };

      if (name === "stockId") {
        const stock = stocks.find((s) => s._id === value);
        if (stock) {
          updated.purchaseRate = stock.purchaseRate;
          updated.weight = Number(updated.quantity || 0) * Number(stock.weightPerKatta || 0);
        } else {
          updated.purchaseRate = "";
          updated.weight = "";
        }
      }

      if (name === "quantity") {
        const stock = stocks.find((s) => s._id === updated.stockId);
        if (stock) {
          updated.weight = Number(value || 0) * Number(stock.weightPerKatta || 0);
        }
      }

      return updated;
    });

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const bhardana = Number(form.quantity || 0) * Number(form.bhardanaRate || 0);

  const totalAmount = Number(form.weight || 0) * Number(form.rate || 0) + Number(bhardana || 0);

  const profit =
    (Number(form.rate || 0) - Number(form.purchaseRate || 0)) * Number(form.weight || 0) 

  const remainingAmount =
    form.status === "paid"
      ? 0
      : form.status === "partial"
        ? totalAmount - Number(form.paidAmount || 0)
        : totalAmount;

  const validate = () => {
    let temp = {};

    if (!form.date) temp.date = "Date is required";
    if (!form.buyerId) temp.buyerId = "Select Buyer";
    if (!form.stockId) temp.stockId = "Select Stock";

    const selectedStock = stocks.find((s) => s._id === form.stockId);

    if (!form.quantity) {
      temp.quantity = "Enter Quantity";
    } else if (Number(form.quantity) <= 0) {
      temp.quantity = "Quantity must be > 0";
    } else if (selectedStock && Number(form.quantity) > Number(selectedStock.remainingQuantity)) {
      temp.quantity = `Exceeds stock (${selectedStock.remainingQuantity} available)`;
    }

    if (!form.rate) {
      temp.rate = "Enter Sale Rate";
    } else if (Number(form.rate) <= 0) {
      temp.rate = "Rate must be > 0";
    }

    if (!form.status) temp.status = "Select Status";

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
      const stock = stocks.find((s) => s._id === form.stockId);

      if (!stock) {
        toast.error("Selected stock not found");
        return;
      }

      await api.post("/sales/createInvoice", {
        date: form.date ? form.date.toDate() : new Date(),
        buyerId: form.buyerId,
        stockId: form.stockId,
        itemName: stock.itemName,
        quantity: Number(form.quantity),
        weight: Number(form.weight || 0),
        rate: Number(form.rate),
        purchaseRate: Number(form.purchaseRate || stock.purchaseRate || 0),
        totalAmount,
        profit,
        bhardanaRate: Number(form.bhardanaRate || 0),
        bhardana,
        paidAmount: Number(form.paidAmount || 0),
        remainingAmount,
        paymentType: form.paymentType,
        status: form.status,
        dueDays: form.paymentType === "udhar" ? Number(form.dueDays) : 0,
        dueDate: null,
      });

      toast.success("Invoice created successfully");
      setTimeout(() => navigate("/sales"), 1000);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create invoice");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuyers();
    fetchStocks();
  }, []);

  return (
    <Box sx={styles.container}>
      <Box sx={styles.header}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/sales")}>
            Back
          </Button>
          <Typography sx={styles.heading}>Create New Invoice</Typography>
        </Box>
      </Box>

      <Box sx={styles.formLayout}>
        {/* Left Side: Form Details */}
        <Box sx={styles.formSection}>
          <Typography sx={styles.sectionTitle}>1. Party & Item Details</Typography>
          
          <Box sx={styles.gridRow}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DemoContainer components={["DatePicker"]} sx={{ paddingTop: 0 }}>
                <DatePicker
                  value={form.date}
                  onChange={(date) => {
                    setForm({ ...form, date });
                    if (errors.date) setErrors({ ...errors, date: "" });
                  }}
                  slotProps={{ textField: { fullWidth: true, error: !!errors.date, helperText: errors.date } }}
                />
              </DemoContainer>
            </LocalizationProvider>

            <FormControl error={!!errors.buyerId} fullWidth>
              <InputLabel>Select Buyer</InputLabel>
              <Select name="buyerId" value={form.buyerId} onChange={handleChange} label="Select Buyer">
                {buyers.map((b) => (
                  <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>
                ))}
              </Select>
              {errors.buyerId && <FormHelperText>{errors.buyerId}</FormHelperText>}
            </FormControl>
          </Box>

          <FormControl error={!!errors.stockId} fullWidth>
            <InputLabel>Select Stock Item</InputLabel>
            <Select name="stockId" value={form.stockId} onChange={handleChange} label="Select Stock Item">
              {stocks.map((stock) => (
                <MenuItem key={stock._id} value={stock._id}>
                  <Box sx={styles.stockDetailsContainer}>
                    <Typography sx={styles.stockName}>{stock.itemName}</Typography>
                    <Box sx={styles.stockDetails}>
                      <Typography sx={styles.stockDetail}>Qty: {stock.remainingQuantity}</Typography>
                      <Typography sx={styles.stockDetail}>• Cost: Rs. {stock.purchaseRate}</Typography>
                      <Typography sx={styles.stockDetail}>• Miller: {stock.millerId?.name || "N/A"}</Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
            {errors.stockId && <FormHelperText>{errors.stockId}</FormHelperText>}
          </FormControl>

          <Box sx={styles.gridRow}>
            <TextField
              label="Quantity (Kattas)"
              name="quantity"
              value={form.quantity}
              onChange={handleChange}
              error={!!errors.quantity}
              helperText={errors.quantity}
              type="number"
              fullWidth
            />
            <TextField
              label="Sale Rate (Rs)"
              name="rate"
              value={form.rate}
              onChange={handleChange}
              error={!!errors.rate}
              helperText={errors.rate}
              type="number"
              fullWidth
            />
          </Box>

          <Box sx={styles.gridRow}>
             <TextField
              label="Calculated Weight (kg)"
              name="weight"
              value={form.weight}
              onChange={handleChange}
              type="number"
              InputProps={{ readOnly: true }}
              fullWidth
              helperText="Auto-calculated from stock item"
            />
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
          </Box>

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

        {/* Right Side: Live Bill Summary */}
        <Box sx={styles.summarySection}>
          <Typography sx={styles.summaryTitle}>
            <ReceiptIcon color="primary" /> Live Bill Summary
          </Typography>
          
          <Box sx={styles.billSummaryDetails}>
            <Box sx={styles.billSummaryDetail}>
              <Typography>Total Weight</Typography>
              <Typography sx={styles.detailValue}>{form.weight || 0} kg</Typography>
            </Box>
            <Box sx={styles.billSummaryDetail}>
              <Typography>Sale Rate</Typography>
              <Typography sx={styles.detailValue}>Rs. {form.rate || 0} / kg</Typography>
            </Box>
            <Box sx={styles.billSummaryDetail}>
              <Typography>Gross Amount</Typography>
              <Typography sx={styles.detailValue}>Rs. {(Number(form.weight || 0) * Number(form.rate || 0)).toLocaleString()}</Typography>
            </Box>
            <Box sx={styles.billSummaryDetail}>
              <Typography>Bhardana Charges</Typography>
              <Typography sx={styles.detailValue}>+ Rs. {bhardana.toLocaleString()}</Typography>
            </Box>
            
            <Box sx={styles.totalRow}>
              <Typography variant="h6">Total Bill</Typography>
              <Typography variant="h6">Rs. {totalAmount.toLocaleString()}</Typography>
            </Box>

            {form.status === "partial" && (
              <Box sx={{ ...styles.billSummaryDetail, borderBottom: 'none', mt: 1 }}>
                <Typography color="error">Paid Amount</Typography>
                <Typography sx={{ ...styles.detailValue, color: 'error.main' }}>- Rs. {Number(form.paidAmount || 0).toLocaleString()}</Typography>
              </Box>
            )}

            {(form.status === "partial" || form.status === "unpaid") && (
              <Box sx={{ ...styles.totalRow, borderTop: 'none', paddingTop: 0, marginTop: 0, color: 'text.primary' }}>
                <Typography variant="subtitle1" fontWeight={600}>Remaining Balance</Typography>
                <Typography variant="subtitle1" fontWeight={700}>Rs. {remainingAmount.toLocaleString()}</Typography>
              </Box>
            )}

            <Box sx={styles.profitRow}>
              <Typography variant="body2">Est. Gross Profit</Typography>
              <Typography variant="body2" fontWeight={700}>Rs. {profit.toLocaleString()}</Typography>
            </Box>
          </Box>

          <Button
            variant="contained"
            color="primary"
            sx={styles.button}
            onClick={handleSubmit}
            disabled={loading}
            fullWidth
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Save & Generate Invoice"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default CreateInvoice;
