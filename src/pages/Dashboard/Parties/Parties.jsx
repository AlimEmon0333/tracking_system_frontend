import {
  Button,
  CircularProgress,
  Grid,
  IconButton,
  Typography,
  useMediaQuery,
  Box,
  Tooltip,
} from "@mui/material";
import React, { useState, useEffect } from "react";
import { partiesStyle } from "./partiesStyles";
import AddIcon from "@mui/icons-material/Add";
import { SmallMobileView, colors } from "../../../styles/theme";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../../api/axios";
import ArrowRightAltIcon from "@mui/icons-material/ArrowRightAlt";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from '@mui/icons-material/Delete';

import LocalPhoneIcon from "@mui/icons-material/LocalPhone";
import DeleteModal from "./DeleteModal/DeleteModal";

const Parties = () => {
  const mobileView = useMediaQuery(SmallMobileView);
  const styles = partiesStyle(mobileView);
  const navigate = useNavigate();

  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
  };
  const handleOpenDeleteModal = (id) => {
    setSelectedId(id);
    setDeleteModalOpen(true);
  };

  const handleAddParty = () => {
    navigate("/parties/add");
  };

  const fetchParties = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/party");
      setParties(data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch parties");
    } finally {
      setLoading(false);
    }
  };
  const handleSuccess = () => {
    fetchParties();
  };

  useEffect(() => {
    fetchParties();
  }, []);

  return (
    <Box>
      <Box sx={styles.top}>
        <Box>
          <Typography sx={styles.heading}>Parties Directory</Typography>
          <Typography variant="body2" color="textSecondary">Manage your buyers and suppliers</Typography>
        </Box>
        <Button
          sx={styles.button}
          startIcon={mobileView ? null : <AddIcon />}
          onClick={handleAddParty}
        >
          {mobileView ? "Add" : "Add New Party"}
        </Button>
      </Box>

      <Box sx={styles.partiesContainer}>
        {loading ? (
          <Box sx={styles.loadingCont}>
            <CircularProgress />
          </Box>
        ) : parties.length === 0 ? (
          <Box sx={styles.noPartiesCont}>
            <Typography sx={styles.noPartiesText}>
              No parties found. Click "Add New Party" to create one.
            </Typography>
          </Box>
        ) : (
          <Box sx={styles.partyCont}>
            {parties.map((party) => (
              <Box key={party._id} sx={styles.partyCard}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%" }}>
                  <Box>
                    <Typography sx={styles.name}>{party.name}</Typography>
                    <Typography 
                      sx={party.type.toLowerCase() === "buyer" ? styles.chipBuyer : styles.chipMiller}
                      style={{ display: "inline-block", marginTop: "8px" }}
                    >
                      {party.type}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    <Tooltip title="Edit Party">
                      <IconButton
                        size="small"
                        sx={{ color: colors.textSecondary, bgcolor: colors.surfaceMuted }}
                        onClick={() => navigate(`/parties/edit/${party._id}`)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Party">
                      <IconButton
                        size="small"
                        sx={{ color: colors.error, bgcolor: colors.errorLight }}
                        onClick={() => handleOpenDeleteModal(party._id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <Typography sx={styles.phone}>
                  <LocalPhoneIcon fontSize="small" sx={{ color: colors.textSecondary }} /> 
                  {party.phone || "No phone added"}
                </Typography>

                <Button
                  sx={styles.detailButton}
                  endIcon={<ArrowRightAltIcon />}
                  disableRipple
                  onClick={() => toast.info("View details coming soon!")}
                >
                  View History
                </Button>
              </Box>
            ))}
          </Box>
        )}
      </Box>
      <DeleteModal
        open={deleteModalOpen}
        close={handleCloseDeleteModal}
        onSuccess={handleSuccess}
        id={selectedId}
      />
    </Box>
  );
};

export default Parties;
