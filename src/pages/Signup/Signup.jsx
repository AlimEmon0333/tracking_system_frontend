import {
  Box,
  TextField,
  Typography,
  Button,
  useMediaQuery,
  CircularProgress,
  InputAdornment,
  IconButton,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { signupStyles } from "./signupStyles";
import { Link, useNavigate } from "react-router-dom";
import PersonIcon from "@mui/icons-material/Person";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { SmallMobileView } from "../../styles/theme";
import { toast } from "react-toastify";
import api from "../../api/axios";

const Signup = () => {
  const mobileView = useMediaQuery(SmallMobileView);
  const styles = signupStyles(mobileView);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const validate = () => {
    let tempErrors = {};

    if (!form.name) tempErrors.name = "Name is required";

    if (!form.email) {
      tempErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      tempErrors.email = "Email is invalid";
    }

    if (!form.password) {
      tempErrors.password = "Password is required";
    } else if (form.password.length < 6) {
      tempErrors.password = "Password must be at least 6 characters";
    }

    setErrors(tempErrors);

    return Object.keys(tempErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      const { data } = await api.post("/auth/signup", form);
      localStorage.setItem("user", JSON.stringify(data));
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSignup();
    }
  };

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      navigate("/");
    }
  }, [navigate]);

  return (
    <Box sx={styles.pageWrapper}>
      {/* Left Panel - Branding */}
      <Box sx={styles.leftPanel}>
        <Typography sx={styles.brandingTitle}>Tracking System</Typography>
        <Typography sx={styles.brandingSubtitle}>
          Join us today to manage your business operations seamlessly.
        </Typography>
      </Box>

      {/* Right Panel - Form */}
      <Box sx={styles.rightPanel}>
        <Box sx={styles.formWrapper}>
          <Box sx={styles.headerBox}>
            <Typography sx={styles.title}>Create an account</Typography>
            <Typography sx={styles.subtitle}>
              Fill in your details below to get started.
            </Typography>
          </Box>

          <Box sx={styles.formContainer}>
            <TextField
              label="Full Name"
              name="name"
              placeholder="John Doe"
              value={form.name}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              error={!!errors.name}
              helperText={errors.name}
              fullWidth
            />
            <TextField
              label="Email address"
              name="email"
              placeholder="name@company.com"
              value={form.email}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              error={!!errors.email}
              helperText={errors.email}
              fullWidth
            />
            <TextField
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              error={!!errors.password}
              helperText={errors.password}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword((prev) => !prev)}
                      edge="end"
                      tabIndex={-1}
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Button
            variant="contained"
            color="primary"
            sx={styles.signupButton}
            endIcon={!loading && <PersonIcon />}
            onClick={handleSignup}
            disabled={loading}
            fullWidth
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Sign Up"}
          </Button>

          <Typography sx={styles.loginText}>
            Already have an account?{" "}
            <Link to="/login" style={styles.loginLink}>
              Sign In
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Signup;
