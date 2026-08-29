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
import DeleteIcon from '@mui/icons-material/Delete';
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AddIcon from "@mui/icons-material/Add";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

import api from "../../../api/axios";
import { colors } from "../../../styles/theme";
import { SalesStyles } from "./salesStyle";
import RecordPaymentModal from "../Payments/RecordPaymentModal";
import ReceiptModal from "../../../components/ReceiptModal/ReceiptModal";

const Sales = () => {
  const styles = SalesStyles();
  const navigate = useNavigate();

  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  // Record Payment Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [targetPayment, setTargetPayment] = useState(null);

  // Receipt Modal State
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/sales");
      setSales(data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id) => {
    setSelectedId(id);
    setOpenDelete(true);
  };

  const deleteSale = async () => {
    try {
      await api.delete(`/sales/${selectedId}`);
      toast.success("Invoice deleted successfully");
      setOpenDelete(false);
      setSelectedId(null);
      fetchSales();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete invoice");
    }
  };

  const handleCollectPayment = (sale) => {
    setTargetPayment({
      type: "inflow",
      partyName: sale.buyerId?.name || "Customer",
      partyId: sale.buyerId?._id || sale.buyerId,
      partyType: "Buyer",
      relatedType: "Sale",
      relatedId: sale._id,
      referenceNumber: sale.billNumber,
      remainingAmount: sale.remainingAmount,
      itemName: sale.itemName,
    });
    setModalOpen(true);
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const renderStatus = (status) => {
    if (status === "paid") {
      return <Box sx={styles.paidStatus}>Paid</Box>;
    } else if (status === "partial") {
      return <Box sx={styles.partialStatus}>Partial</Box>;
    } else {
      return <Box sx={styles.unpaidStatus}>Unpaid</Box>;
    }
  };

  const renderDueDate = (sale) => {
    const remaining = Number(sale.remainingAmount || 0);
    if (remaining <= 0) {
      return (
        <Chip
          size="small"
          label="Settled"
          sx={{ backgroundColor: colors.successLight, color: colors.successDark, fontWeight: 700 }}
        />
      );
    }

    const saleDate = new Date(sale.date);
    let dueDate = sale.dueDate ? new Date(sale.dueDate) : null;
    if (!dueDate) {
      const days = Number(sale.dueDays || 0);
      dueDate = new Date(saleDate.getTime() + days * 24 * 60 * 60 * 1000);
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
      <Box sx={styles.header}>
        <Typography sx={styles.headerText}>Invoices</Typography>
        <Button
          sx={styles.createInvoiceButton}
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate("/createInvoice")}
        >
          New Invoice
        </Button>
      </Box>

      <TableContainer component={Paper} sx={styles.tableContainer}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Bill #</TableCell>
              <TableCell>Date / Due</TableCell>
              <TableCell>Buyer</TableCell>
              <TableCell>Item</TableCell>
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
            ) : sales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6, color: colors.textSecondary }}>
                  No Invoices Found. Click 'New Invoice' to get started.
                </TableCell>
              </TableRow>
            ) : (
              sales.map((sale) => {
                const date = new Date(sale.date).toLocaleDateString();
                const remaining = Number(sale.remainingAmount || 0);

                return (
                  <TableRow key={sale._id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>#{sale.billNumber}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{date}</Typography>
                        <Box mt={0.5}>{renderDueDate(sale)}</Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>
                      {sale.buyerId?.name || "N/A"}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{sale.itemName}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {sale.weight} kg @ Rs.{sale.rate}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      Rs. {sale.totalAmount?.toLocaleString()}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        color: remaining > 0 ? colors.error : colors.success,
                      }}
                    >
                      Rs. {remaining?.toLocaleString()}
                    </TableCell>
                    <TableCell>{renderStatus(sale.status)}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                        {remaining > 0 && (
                          <Tooltip title="Collect Payment">
                            <IconButton
                              size="small"
                              sx={{ color: colors.success, bgcolor: colors.successLight }}
                              onClick={() => handleCollectPayment(sale)}
                            >
                              <PointOfSaleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="View Receipt">
                          <IconButton
                            size="small"
                            sx={{ color: colors.primary, bgcolor: colors.infoLight }}
                            onClick={() => {
                              setReceiptData(sale);
                              setReceiptOpen(true);
                            }}
                          >
                            <ReceiptLongIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Invoice">
                          <IconButton
                            size="small"
                            sx={{ color: colors.error, bgcolor: colors.errorLight }}
                            onClick={() => handleDeleteClick(sale._id)}
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

      {/* Delete Confirmation Modal */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle sx={{ fontWeight: 700, color: colors.error }}>Delete Invoice</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this invoice? This action is permanent and will restore the associated stock inventory.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenDelete(false)} color="inherit">Cancel</Button>
          <Button color="error" variant="contained" onClick={deleteSale} disableElevation>
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
        onSuccess={fetchSales}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        open={receiptOpen}
        onClose={() => {
          setReceiptOpen(false);
          setReceiptData(null);
        }}
        data={receiptData}
        type="sale"
      />
    </Box>
  );
};

export default Sales;
