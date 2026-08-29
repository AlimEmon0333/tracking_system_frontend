import React, { useRef, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Tooltip,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import PrintIcon from "@mui/icons-material/Print";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import ImageIcon from "@mui/icons-material/Image";
import CloseIcon from "@mui/icons-material/Close";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "react-toastify";

import { colors } from "../../styles/theme";
import { receiptStyles } from "./receiptStyles";

const ReceiptModal = ({ open, onClose, data, type = "sale" }) => {
  const styles = receiptStyles();
  const receiptRef = useRef();
  const [downloading, setDownloading] = useState(false);

  if (!data) return null;

  // Derive Details based on Type
  let title = "Official Receipt";
  let refLabel = "Ref #";
  let refValue = "";
  let partyLabel = "Party Details";
  let partyName = "";
  let partyPhone = "";
  let partyAddress = "";
  let dateValue = new Date().toLocaleDateString();
  let status = "paid";
  let totalAmount = 0;
  let paidAmount = 0;
  let remainingAmount = 0;
  let paymentMethod = "Cash";

  if (type === "sale") {
    title = "Sales Invoice Receipt";
    refLabel = "Bill #";
    refValue = data.billNumber || "N/A";
    partyLabel = "Customer / Buyer";
    partyName = data.buyerId?.name || data.buyer?.name || "Customer";
    partyPhone = data.buyerId?.phone || data.buyer?.phone || "";
    partyAddress = data.buyerId?.address || data.buyer?.address || "";
    dateValue = data.date ? new Date(data.date).toLocaleDateString() : dateValue;
    status = data.status || "unpaid";
    totalAmount = Number(data.totalAmount || 0);
    paidAmount = Number(data.paidAmount || 0);
    remainingAmount = Number(data.remainingAmount || 0);
    paymentMethod = data.paymentType || "Cash";
  } else if (type === "stock") {
    title = "Purchase Voucher Receipt";
    refLabel = "Receipt #";
    refValue = data.receiptNumber || "N/A";
    partyLabel = "Supplier / Miller";
    partyName = data.millerId?.name || data.miller?.name || "Supplier";
    partyPhone = data.millerId?.phone || data.miller?.phone || "";
    partyAddress = data.millerId?.address || data.miller?.address || "";
    dateValue = data.date ? new Date(data.date).toLocaleDateString() : dateValue;
    status = data.status || "unpaid";
    totalAmount = Number(data.totalAmount || 0);
    paidAmount = Number(data.paidAmount || 0);
    remainingAmount = Number(data.remainingAmount || 0);
    paymentMethod = data.paymentType || "Cash";
  } else if (type === "payment") {
    const isInflow = data.type === "inflow";
    title = isInflow ? "Payment Inflow Receipt" : "Payment Outflow Voucher";
    refLabel = "Payment Ref #";
    refValue = data.referenceNumber || data._id?.substring(0, 8) || "N/A";
    partyLabel = isInflow ? "Received From" : "Paid To";
    partyName = data.partyId?.name || data.partyName || "Party";
    partyPhone = data.partyId?.phone || "";
    dateValue = data.paymentDate
      ? new Date(data.paymentDate).toLocaleDateString()
      : dateValue;
    status = "paid";
    totalAmount = Number(data.amount || 0);
    paidAmount = totalAmount;
    remainingAmount = 0;
    paymentMethod = data.paymentMethod || "Cash";
  } else if (type === "bank") {
    title =
      data.type === "deposit"
        ? "Bank Deposit Voucher"
        : data.type === "withdrawal"
        ? "Bank Withdrawal Voucher"
        : "Bank Transaction Voucher";
    refLabel = "Tx Ref #";
    refValue = data.referenceNumber || "BANK-TX";
    partyLabel = "Bank Account";
    partyName =
      data.bankAccountId?.accountName ||
      data.bankAccountId?.bankName ||
      "Bank Account";
    partyPhone = data.bankAccountId?.accountNumber
      ? `A/C: ${data.bankAccountId.accountNumber}`
      : "";
    dateValue = data.date ? new Date(data.date).toLocaleDateString() : dateValue;
    status = "paid";
    totalAmount = Number(data.amount || 0);
    paidAmount = totalAmount;
    remainingAmount = 0;
    paymentMethod = data.paymentMethod || "Bank Transfer";
  }

  // 1. PDF Download
  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;
    try {
      setDownloading(true);
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 190;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
      pdf.save(`Receipt_${refValue || "Doc"}.pdf`);
      toast.success("Receipt PDF downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF. Using print dialog.");
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  // 2. PNG Image Download
  const handleDownloadImage = async () => {
    if (!receiptRef.current) return;
    try {
      setDownloading(true);
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `Receipt_${refValue || "Doc"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Receipt Image saved!");
    } catch (err) {
      toast.error("Failed to save image");
    } finally {
      setDownloading(false);
    }
  };

  // 3. Print
  const handlePrint = () => {
    window.print();
  };

  // 4. WhatsApp Share
  const handleWhatsAppShare = () => {
    let text = `*📄 ${title}*\n`;
    text += `*${refLabel}:* ${refValue}\n`;
    text += `*Date:* ${dateValue}\n`;
    text += `*${partyLabel}:* ${partyName}\n`;
    if (data.itemName) {
      text += `*Item:* ${data.itemName}\n`;
      text += `*Quantity:* ${data.quantity || "-"} | *Weight:* ${data.weight || "-"} kg\n`;
      text += `*Rate:* Rs. ${data.rate || data.purchaseRate || "-"}\n`;
    }
    text += `--------------------------\n`;
    text += `*Total Amount:* Rs. ${totalAmount}\n`;
    text += `*Paid Amount:* Rs. ${paidAmount}\n`;
    text += `*Remaining Balance:* Rs. ${remainingAmount}\n`;
    text += `*Status:* ${status.toUpperCase()}\n`;
    text += `--------------------------\n`;
    text += `_Thank you for your business!_`;

    const cleanPhone = partyPhone.replace(/\D/g, "");
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone.startsWith("0") ? "92" + cleanPhone.slice(1) : cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;

    window.open(waUrl, "_blank");
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      {/* Dialog Header Actions */}
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: colors["100"],
          borderBottom: `1px solid ${colors["300"]}`,
          padding: "12px 24px",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: "bold", color: colors["950"] }}>
          🧾 {title}
        </Typography>

        <Box sx={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <Tooltip title="Download PDF">
            <Button
              size="small"
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadPDF}
              disabled={downloading}
              sx={{ backgroundColor: colors["900"], textTransform: "none", fontWeight: "bold" }}
            >
              PDF
            </Button>
          </Tooltip>

          <Tooltip title="Download Image">
            <Button
              size="small"
              variant="outlined"
              startIcon={<ImageIcon />}
              onClick={handleDownloadImage}
              disabled={downloading}
              sx={{ textTransform: "none", fontWeight: "bold" }}
            >
              Image
            </Button>
          </Tooltip>

          <Tooltip title="Share on WhatsApp">
            <Button
              size="small"
              variant="contained"
              color="success"
              startIcon={<WhatsAppIcon />}
              onClick={handleWhatsAppShare}
              sx={{ textTransform: "none", fontWeight: "bold" }}
            >
              WhatsApp
            </Button>
          </Tooltip>

          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Printable Receipt Canvas */}
      <DialogContent sx={{ padding: "24px", backgroundColor: "#f8fafc" }}>
        <Box ref={receiptRef} sx={styles.receiptWrapper}>
          {/* Header */}
          <Box sx={styles.header}>
            <Box>
              <Typography sx={styles.companyName}>TRACKING SYSTEM</Typography>
              <Typography sx={styles.companyTagline}>
                Commercial Inventory, Milling & Payment Tracking
              </Typography>
            </Box>
            <Box>
              <Typography sx={styles.receiptTitle}>{title}</Typography>
              <Typography sx={styles.receiptMeta}>
                <strong>{refLabel}:</strong> {refValue}
              </Typography>
              <Typography sx={styles.receiptMeta}>
                <strong>Date:</strong> {dateValue}
              </Typography>
            </Box>
          </Box>

          {/* Party & Voucher Info */}
          <Box sx={styles.infoSection}>
            <Box sx={styles.infoCol}>
              <Typography sx={styles.infoLabel}>{partyLabel}</Typography>
              <Typography sx={styles.infoValue}>{partyName}</Typography>
              {partyPhone && (
                <Typography variant="body2" color="textSecondary">
                  Phone: {partyPhone}
                </Typography>
              )}
              {partyAddress && (
                <Typography variant="body2" color="textSecondary">
                  Address: {partyAddress}
                </Typography>
              )}
            </Box>

            <Box sx={{ ...styles.infoCol, alignItems: "flex-end" }}>
              <Typography sx={styles.infoLabel}>Payment Status</Typography>
              <Box sx={{ marginTop: "4px" }}>
                {status === "paid" && <span style={styles.paidStamp}>PAID</span>}
                {status === "partial" && <span style={styles.partialStamp}>PARTIAL</span>}
                {status === "unpaid" && <span style={styles.unpaidStamp}>UNPAID</span>}
              </Box>
            </Box>
          </Box>

          {/* Itemized Table (For Sales & Stock) */}
          {(type === "sale" || type === "stock") && (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Description / Item</th>
                  <th>Quantity</th>
                  <th>Weight (kg)</th>
                  <th>Rate (Rs.)</th>
                  <th>Bhardana</th>
                  <th>Total (Rs.)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>{data.itemName || "Commercial Goods"}</strong>
                  </td>
                  <td>{data.quantity || data.totalQuantity || "-"}</td>
                  <td>{data.weight || data.totalWeight || "-"}</td>
                  <td>Rs. {data.rate || data.purchaseRate || 0}</td>
                  <td>Rs. {data.bhardana || 0}</td>
                  <td>
                    <strong>Rs. {totalAmount}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          )}

          {/* Details Table (For Payment & Bank) */}
          {(type === "payment" || type === "bank") && (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Transaction Particulars</th>
                  <th>Payment Mode</th>
                  <th>Reference</th>
                  <th>Amount (Rs.)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>{data.notes || title}</strong>
                  </td>
                  <td style={{ textTransform: "capitalize" }}>
                    {paymentMethod?.replace("_", " ")}
                  </td>
                  <td>{refValue}</td>
                  <td>
                    <strong>Rs. {totalAmount}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          )}

          {/* Summary Box */}
          <Box sx={styles.summaryContainer}>
            <Box sx={styles.summaryBox}>
              <Box sx={styles.summaryRow}>
                <span>Total Amount:</span>
                <strong>Rs. {totalAmount}</strong>
              </Box>
              <Box sx={styles.summaryRow}>
                <span>Paid Amount:</span>
                <strong style={{ color: "#16a34a" }}>Rs. {paidAmount}</strong>
              </Box>
              <Box sx={styles.summaryTotalRow}>
                <span>Balance Due:</span>
                <span style={{ color: remainingAmount > 0 ? colors["error"] : colors["success"] }}>
                  Rs. {remainingAmount}
                </span>
              </Box>
            </Box>
          </Box>

          {/* Footer Signature */}
          <Box sx={styles.footer}>
            <Box sx={styles.signBlock}>
              <Box sx={styles.signLine}></Box>
              <Typography sx={styles.signLabel}>Customer / Receiver Signature</Typography>
            </Box>
            <Typography variant="caption" color="textSecondary">
              * This is a computer generated voucher and invoice record.
            </Typography>
            <Box sx={styles.signBlock}>
              <Box sx={styles.signLine}></Box>
              <Typography sx={styles.signLabel}>Authorized Signature</Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ padding: "12px 24px" }}>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          sx={{ backgroundColor: colors["300"], color: colors["950"], fontWeight: "bold" }}
        >
          Print Receipt
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReceiptModal;
