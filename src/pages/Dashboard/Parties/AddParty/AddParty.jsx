import React, { useState } from "react";
import { addPartyStyle } from "./addPartyStyles";
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
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const AddParty = () => {
  const styles = addPartyStyle();
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (event) => {
    setType(event.target.value);
  };

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const handleChangeInput = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddParty = async () => {
    if (!form.name || !type || !form.phone || !form.address) {
      toast.error("All fields are required");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        ...form,
        type,
      };

      await api.post("/party/create", payload);

      toast.success("Party added successfully ");

      // reset form
      setForm({
        name: "",
        phone: "",
        address: "",
      });
      setType("");

      navigate("/parties");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add party");
    } finally {
      setLoading(false);
    }
  };
  return (
    <Grid container sx={styles.container}>
      <Typography sx={styles.heading}>Add Party</Typography>
      <Grid sx={styles.form}>
        <TextField
          id="standard-basic"
          label="Name"
          variant="standard"
          name="name"
          value={form.name}
          onChange={handleChangeInput}
        />
        <TextField
          id="standard-basic"
          label="Phone Number"
          variant="standard"
          name="phone"
          value={form.phone}
          onChange={handleChangeInput}
        />
        <TextField
          id="standard-basic"
          label="Address"
          variant="standard"
          name="address"
          value={form.address}
          onChange={handleChangeInput}
        />
        <FormControl variant="standard">
          <InputLabel id="demo-simple-select-standard-label">Type</InputLabel>
          <Select
            labelId="demo-simple-select-standard-label"
            id="demo-simple-select-standard"
            value={type}
            onChange={handleChange}
            name="type"
          >
            <MenuItem value={"Miller"}>Miller</MenuItem>
            <MenuItem value={"Buyer"}>Buyer</MenuItem>
          </Select>
        </FormControl>
        <Button sx={styles.button} onClick={handleAddParty}>
          Add Party
        </Button>
      </Grid>
    </Grid>
  );
};

export default AddParty;
