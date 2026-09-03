import { Routes, Route } from "react-router-dom";

import Login from "../pages/Login/Login";
import Signup from "../pages/Signup/Signup";
import Dashboard from "../pages/Dashboard/Dashboard";
import Parties from "../pages/Dashboard/Parties/Parties";
import AddParty from "../pages/Dashboard/Parties/AddParty/AddParty";
import EditParty from "../pages/Dashboard/Parties/EditParty/EditParty";
import PartyDetails from "../pages/Dashboard/Parties/PartyDetails/PartyDetails";

import AuthLayout from "../layouts/AuthLayout/AuthLayout";
import AppLayout from "../layouts/AppLayout/AppLayout";

import ProtectedRoute from "./ProtectedRoute";
import GuestRoute from "./GuestRoute";
import AddStock from "../pages/Dashboard/Stock/AddStock/AddStock";
import Stock from "../pages/Dashboard/Stock/Stock";
import EditStock from "../pages/Dashboard/Stock/EditStock/EditStock";
import UpdateStock from "../pages/Dashboard/Stock/UpdateStock/UpdateStock";
import Sales from "../pages/Dashboard/Sales/Sales";
import CreateInvoice from "../pages/Dashboard/Sales/createInvoice/CreateInvoice";
import Payments from "../pages/Dashboard/Payments/Payments";
import BankAccounts from "../pages/Dashboard/Bank/BankAccounts";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<GuestRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>
      </Route>

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/parties" element={<Parties />} />
          <Route path="/parties/add" element={<AddParty />} />
          <Route path="/parties/edit/:id" element={<EditParty />} />
          <Route path="/parties/:id" element={<PartyDetails />} />
          <Route path="/stocks/add" element={<AddStock />} />
          <Route path="/stocks/edit/:id" element={<EditStock />} />
          <Route path="/stocks/update/:id" element={<UpdateStock />} />
          <Route path="/stocks" element={<Stock />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/createInvoice" element={<CreateInvoice />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/bank" element={<BankAccounts />} />
        </Route>
      </Route>
    </Routes>
  );
}
