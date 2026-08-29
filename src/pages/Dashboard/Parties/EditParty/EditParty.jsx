import {
  Button,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState, useEffect } from "react";
import { editPartyStyle } from "./editPartyStyles";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../../api/axios";
import { toast } from "react-toastify";

const EditParty = () => {
  const styles = editPartyStyle();
  const navigate = useNavigate();
  const { id } = useParams();

  const [type, setType] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const fetchParty = async () => {
    try {
      setLoading(true);

      const { data } = await api.get(`/party/${id}`);

      setForm({
        name: data.data.name || "",
        phone: data.data.phone || "",
        address: data.data.address || "",
      });

      setType(data.data.type || "");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load party");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParty();
  }, [id]);

  const handleChangeInput = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleChange = (event) => {
    setType(event.target.value);
  };

  const handleEditParty = async () => {
    try {
      setLoading(true);

      const { data } = await api.put(`/party/${id}`, {
        ...form,
        type,
      });

      toast.success(data.message || "Party updated successfully");

      navigate("/parties");
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid container sx={styles.container}>
      <Typography sx={styles.heading}>Edit Party</Typography>

      <Grid sx={styles.form}>
        <TextField
          label="Name"
          variant="standard"
          name="name"
          value={form.name}
          onChange={handleChangeInput}
        />

        <TextField
          label="Phone Number"
          variant="standard"
          name="phone"
          value={form.phone}
          onChange={handleChangeInput}
        />

        <TextField
          label="Address"
          variant="standard"
          name="address"
          value={form.address}
          onChange={handleChangeInput}
        />

        <FormControl variant="standard">
          <InputLabel>Type</InputLabel>
          <Select value={type} onChange={handleChange}>
            <MenuItem value={"Miller"}>Miller</MenuItem>
            <MenuItem value={"Buyer"}>Buyer</MenuItem>
          </Select>
        </FormControl>

        <Button sx={styles.button} onClick={handleEditParty} disabled={loading}>
          {loading ? (
            <>
              <CircularProgress sx={styles.loading} aria-label="Loading…" />
            </>
          ) : (
            "Edit Party"
          )}
        </Button>
      </Grid>
    </Grid>
  );
};

export default EditParty;
