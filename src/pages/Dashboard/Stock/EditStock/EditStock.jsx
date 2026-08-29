import React, { useEffect, useState } from "react";
import {
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import api from "../../../../api/axios";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { editStockStyle } from "./editStockStyles";

const EditStock = () => {
  const styles = editStockStyle();

  const navigate = useNavigate();
  const { id } = useParams();

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

  const [millers, setMillers] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const fetchStock = async () => {
    try {
      setLoading(true);

      const { data } = await api.get(`/stock/stocks/${id}`);

      const stock = data.data;

      setForm({
        date: dayjs(stock.date),
        millerId: stock.millerId._id,
        itemName: stock.itemName,

        totalQuantity: stock.totalQuantity,
        weightPerKatta: stock.weightPerKatta,
        totalWeight: stock.totalWeight,

        purchaseRate: stock.purchaseRate,

        totalAmount: stock.totalAmount,
        remainingAmount: stock.remainingAmount,

        bhardanaRate: stock.bhardanaRate,
        bhardana: stock.bhardana,

        paymentType: stock.paymentType,
        status: stock.status,

        paidAmount: stock.paidAmount,

        dueDays: stock.dueDays || "",
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load stock");
    } finally {
      setLoading(false);
    }
  };
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
      const updatedForm = {
        ...prev,
        [name]: value,
      };

      if (name === "totalQuantity" || name === "weightPerKatta") {
        updatedForm.totalWeight =
          Number(updatedForm.totalQuantity || 0) *
          Number(updatedForm.weightPerKatta || 0);
      }

      return updatedForm;
    });
  };
  const purchaseAmount =
    Number(form.totalWeight || 0) * Number(form.purchaseRate || 0);

  const totalBhardana =
    Number(form.totalQuantity || 0) * Number(form.bhardanaRate || 0);

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
      temp.totalQuantity = "Quantity must be greater than 0";
    }

    if (!form.weightPerKatta) {
      temp.weightPerKatta = "Enter weight";
    } else if (Number(form.weightPerKatta) <= 0) {
      temp.weightPerKatta = "Weight must be greater than 0";
    }

    if (!form.purchaseRate) {
      temp.purchaseRate = "Enter purchase rate";
    } else if (Number(form.purchaseRate) <= 0) {
      temp.purchaseRate = "Rate must be greater than 0";
    }

    if (form.paymentType === "Udhar") {
      if (!form.dueDays) temp.dueDays = "Due days required";
    }
    if (!form.status) temp.status = "Select status";

    setErrors(temp);

    return Object.keys(temp).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setLoading(true);

      await api.put(`/stock/stocks/edit/${id}`, {
        ...form,

        date: form.date.toDate(),

        totalAmount,

        bhardana: totalBhardana,

        remainingAmount,

        remainingQuantity,

        remainingWeight,
      });

      toast.success("Stock Edit successfully");

      setTimeout(() => {
        navigate("/stocks");
      }, 1000);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to edit stock");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchMillers();
    fetchStock();
  }, []);
  return (
    <Grid container sx={styles.container}>
      <Typography sx={styles.heading}>Edit Stock</Typography>
      <Grid sx={styles.form}>
        {/* Date Picker */}
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DemoContainer components={["DatePicker"]}>
            <DatePicker
              label="Purchasing Date"
              sx={styles.date}
              value={form.date}
              onChange={(value) =>
                setForm({
                  ...form,
                  date: value,
                })
              }
            />
          </DemoContainer>
        </LocalizationProvider>
        {/* Miller Selector */}
        <FormControl variant="standard">
          <InputLabel id="demo-simple-select-standard-label">Miller</InputLabel>
          <Select
            labelId="demo-simple-select-standard-label"
            id="demo-simple-select-standard"
            name="millerId"
            value={form.millerId}
            onChange={handleChange}
          >
            {millers.map((miller) => (
              <MenuItem key={miller._id} value={miller._id}>
                {miller.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {/* Item Name */}
        <TextField
          id="standard-basic"
          label="Item Name"
          variant="standard"
          name="itemName"
          value={form.itemName}
          onChange={handleChange}
          error={!!errors.itemName}
          helperText={errors.itemName}
        />
        {/* Total Quantity */}
        <TextField
          id="standard-basic"
          label="Total Quantity"
          variant="standard"
          name="totalQuantity"
          value={form.totalQuantity}
          onChange={handleChange}
          error={!!errors.totalQuantity}
          helperText={errors.totalQuantity}
          type="number"
        />
        {/* Weight per bag */}
        <TextField
          id="standard-basic"
          label="Weight per bag"
          variant="standard"
          name="weightPerKatta"
          value={form.weightPerKatta}
          onChange={handleChange}
          error={!!errors.weightPerKatta}
          helperText={errors.weightPerKatta}
          type="number"
        />
        {/* Purchase rate */}
        <TextField
          id="standard-basic"
          label="Purchase rate"
          variant="standard"
          name="purchaseRate"
          value={form.purchaseRate}
          onChange={handleChange}
          error={!!errors.purchaseRate}
          helperText={errors.purchaseRate}
          type="number"
        />
        {/* Bhardana Rate */}
        <TextField
          id="standard-basic"
          label="Bhardana Rate (Optional)"
          variant="standard"
          name="bhardanaRate"
          value={form.bhardanaRate}
          onChange={handleChange}
          type="number"
        />
        {/* Payment Type */}
        <FormControl variant="standard">
          <InputLabel id="demo-simple-select-standard-label">
            Payment Type
          </InputLabel>
          <Select
            labelId="demo-simple-select-standard-label"
            id="demo-simple-select-standard"
            name="paymentType"
            value={form.paymentType}
            onChange={handleChange}
          >
            <MenuItem value={"cash"}>Cash</MenuItem>
            <MenuItem value={"udhar"}>Udhar</MenuItem>
          </Select>
        </FormControl>
        {form.paymentType === "udhar" && (
          <>
            <TextField
              label="Due Days"
              variant="standard"
              name="dueDays"
              value={form.dueDays}
              onChange={handleChange}
              type="number"
            />
          </>
        )}
        {/* Status */}
        <FormControl variant="standard">
          <InputLabel id="demo-simple-select-standard-label">
            Payment Status
          </InputLabel>
          <Select
            labelId="demo-simple-select-standard-label"
            id="demo-simple-select-standard"
            name="status"
            value={form.status}
            onChange={handleChange}
          >
            <MenuItem value={"paid"}>Paid</MenuItem>
            <MenuItem value={"partial"}>Partial</MenuItem>
            <MenuItem value={"unpaid"}>Unpaid</MenuItem>
          </Select>
        </FormControl>
        {/* paid amount */}
        {form.status == "partial" ? (
          <TextField
            label="Paid Amount"
            variant="standard"
            name="paidAmount"
            value={form.paidAmount}
            onChange={handleChange}
            error={!!errors.paidAmount}
            helperText={errors.paidAmount}
            type="number"
          />
        ) : (
          <></>
        )}

        {/* Total Weight */}
        <TextField
          id="standard-basic"
          label="Total Weight"
          variant="standard"
          name="totalWeight"
          value={form.totalWeight}
          onChange={handleChange}
          error={!!errors.totalWeight}
          helperText={errors.totalWeight}
          type="number"
        />
        <Grid sx={styles.summary}>
          <Typography variant="h6" sx={styles.summaryText}>
            Stock Summary
          </Typography>
          <Grid>
            <Typography variant="body1" sx={styles.subTxt}>
              Total Quantity: {form.totalQuantity || 0}
            </Typography>
            <Typography variant="body1" sx={styles.subTxt}>
              Total Weight: {form.totalWeight || 0}kg
            </Typography>
            <Typography variant="body1" sx={styles.subTxt}>
              Purchase Rate: {form.purchaseRate || 0}
            </Typography>
            <Typography variant="body1" sx={styles.subTxt}>
              Bhardana Rate: {form.bhardanaRate || 0}
            </Typography>
            <Typography variant="body1" sx={styles.subTxt}>
              Total Bhardana: {totalBhardana || 0}
            </Typography>

            <Typography variant="body1" sx={styles.subTxt}>
              Paid Amount: {form.paidAmount || 0}
            </Typography>
            <Typography variant="body1" sx={styles.subTxt}>
              Total Cost: {totalAmount || 0}
            </Typography>
            <Typography variant="body1" sx={styles.subTxt}>
              Remaining Cost: {remainingAmount || 0}
            </Typography>
          </Grid>
        </Grid>
        <Button sx={styles.button} onClick={handleSubmit} disabled={loading}>
          {loading ? "Editing..." : "Edit Stock"}
        </Button>
      </Grid>
    </Grid>
  );
};
export default EditStock;
