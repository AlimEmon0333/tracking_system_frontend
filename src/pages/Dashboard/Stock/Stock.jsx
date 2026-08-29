import React, { useEffect, useState } from "react";
import {
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
  Box,
  IconButton,
  Tooltip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import MovieEditIcon from "@mui/icons-material/MovieEdit";
import DeleteIcon from '@mui/icons-material/Delete';
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AddIcon from "@mui/icons-material/Add";
import PaymentIcon from "@mui/icons-material/Payment";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

import api from "../../../api/axios";
import { colors } from "../../../styles/theme";
import { stockStyles } from "./stockStyles";
import RecordPaymentModal from "../Payments/RecordPaymentModal";
import ReceiptModal from "../../../components/ReceiptModal/ReceiptModal";

const Stock = () => {
  const styles = stockStyles();
  const navigate = useNavigate();

  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  // Record Payment Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [targetPayment, setTargetPayment] = useState(null);

  // Receipt Modal State
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  const fetchStocks = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/stock/stocks");
      setStocks(data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch stocks");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id) => {
    setSelectedId(id);
    setOpenDelete(true);
  };

  const deleteStock = async () => {
    try {
      await api.delete(`/stock/stocks/${selectedId}`);
      toast.success("Stock deleted successfully");
      setOpenDelete(false);
      setSelectedId(null);
      fetchStocks();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete stock");
    }
  };

  const handlePaySupplier = (stock) => {
    setTargetPayment({
      type: "outflow",
      partyName: stock.millerId?.name || "Supplier",
      partyId: stock.millerId?._id || stock.millerId,
      partyType: "Miller",
      relatedType: "Stock",
      relatedId: stock._id,
      referenceNumber: stock.receiptNumber,
      remainingAmount: stock.remainingAmount,
      itemName: stock.itemName,
    });
    setModalOpen(true);
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  const renderDueDate = (stock) => {
    const remaining = Number(stock.remainingAmount || 0);
    if (remaining <= 0) {
      return (
        <Chip
          size="small"
          label="Settled"
          sx={{ backgroundColor: colors.successLight, color: colors.successDark, fontWeight: 700 }}
        />
      );
    }

    const stockDate = new Date(stock.date);
    let dueDate = stock.dueDate ? new Date(stock.dueDate) : null;
    if (!dueDate) {
      const days = Number(stock.dueDays || 0);
      dueDate = new Date(stockDate.getTime() + days * 24 * 60 * 60 * 1000);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isOverdue = dueDate < today;

    if (isOverdue) {
      const diffMs = today.getTime() - dueDate.getTime();
      const daysOverdue = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      return (
        <Chip
          size="small"
          label={`${daysOverdue}d Late`}
          sx={{ backgroundColor: colors.errorLight, color: colors.errorDark, fontWeight: 700 }}
          icon={<WarningAmberIcon style={{ fontSize: "16px", color: colors.errorDark }} />}
        />
      );
    }

    return (
      <Typography variant="body2" sx={{ fontSize: "13px", fontWeight: 500, color: colors.textSecondary }}>
        {dueDate.toLocaleDateString()}
      </Typography>
    );
  };

  return (
    <Box sx={styles.container}>
      <Box sx={styles.headingContainer}>
        <Typography sx={styles.heading}>Stock Purchases</Typography>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<AddIcon />}
          onClick={() => navigate("/stocks/add")}
        >
          Add New Stock
        </Button>
      </Box>

      <TableContainer component={Paper} sx={styles.tableContainer}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Receipt #</TableCell>
              <TableCell>Date / Due</TableCell>
              <TableCell>Miller / Supplier</TableCell>
              <TableCell>Item & Qty</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Remaining</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : stocks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6, color: colors.textSecondary }}>
                  No Stock Found. Click 'Add New Stock' to get started.
                </TableCell>
              </TableRow>
            ) : (
              stocks.map((stock) => {
                const date = new Date(stock.date).toLocaleDateString();
                const remaining = Number(stock.remainingAmount || 0);

                return (
                  <TableRow key={stock._id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>#{stock.receiptNumber}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{date}</Typography>
                        <Box mt={0.5}>{renderDueDate(stock)}</Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>
                      {stock.millerId?.name || "N/A"}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{stock.itemName}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Remaining: {stock.remainingQuantity} Qty
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      Rs. {stock.totalAmount?.toLocaleString()}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        color: remaining > 0 ? colors.error : colors.success,
                      }}
                    >
                      Rs. {remaining?.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {stock.remainingQuantity > 0 ? (
                        <Box sx={styles.inStock}>In Stock</Box>
                      ) : (
                        <Box sx={styles.outOfStock}>Out of Stock</Box>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                        {remaining > 0 && (
                          <Tooltip title="Pay Supplier">
                            <IconButton
                              size="small"
                              sx={{ color: colors.secondary, bgcolor: colors.surfaceMuted }}
                              onClick={() => handlePaySupplier(stock)}
                            >
                              <PaymentIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="View Receipt">
                          <IconButton
                            size="small"
                            sx={{ color: colors.primary, bgcolor: colors.infoLight }}
                            onClick={() => {
                              setReceiptData(stock);
                              setReceiptOpen(true);
                            }}
                          >
                            <ReceiptLongIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Stock (Metadata)">
                          <IconButton
                            size="small"
                            sx={{ color: colors.textSecondary }}
                            onClick={() => navigate(`/stocks/edit/${stock._id}`)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Update Qty / Adjustments">
                          <IconButton
                            size="small"
                            sx={{ color: colors.warning }}
                            onClick={() => navigate(`/stocks/update/${stock._id}`)}
                          >
                            <MovieEditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Stock">
                          <IconButton
                            size="small"
                            sx={{ color: colors.error, bgcolor: colors.errorLight }}
                            onClick={() => handleDeleteClick(stock._id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle sx={{ fontWeight: 700, color: colors.error }}>Delete Stock</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this stock purchase? This action is permanent.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenDelete(false)} color="inherit">Cancel</Button>
          <Button color="error" variant="contained" onClick={deleteStock} disableElevation>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Record Payment Modal */}
      <RecordPaymentModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setTargetPayment(null);
        }}
        targetData={targetPayment}
        onSuccess={fetchStocks}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        open={receiptOpen}
        onClose={() => {
          setReceiptOpen(false);
          setReceiptData(null);
        }}
        data={receiptData}
        type="stock"
      />
    </Box>
  );
};

export default Stock;
