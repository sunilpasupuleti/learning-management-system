import { Route, Routes, useLocation } from "react-router-dom";
import { GetAuthGuard } from "./Guards";
import { SocketContextProvider } from "../services/Socket/Socket.context";
import { AuthenticationContextProvider } from "../services/Authentication/Authentication.context";

import PageNotFound from "../components/NotFound/PageNotFound";
import { AnimatePresence } from "framer-motion";
import Signin from "../components/Auth/Signin/Signin";
import Signup from "../components/Auth/Signup/Signup";
import Verify from "../components/Auth/Signup/Verify";
import ResetPassword from "../components/Auth/ResetPassword/ResetPassword";
import Dashboard from "../components/Admin/Dashboard";
import Batches from "../components/Admin/Batches/Batches";
import CreateEditBatch from "../components/Admin/Batches/CreateEditBatch";
import Users from "../components/Admin/Users/Users";
import UsersHome from "../components/Admin/Users/UsersHome";
import CreateEditUser from "../components/Admin/Users/CreateEditUser";
import BatchesHome from "../components/Admin/Batches/BatchesHome";

const Layout = (props) => {
  const location = useLocation();

  return (
    <SocketContextProvider>
      <AuthenticationContextProvider>
        <AnimatePresence mode="wait">
          <Routes key={location.pathname} location={location}>
            <Route path="/" element={<Signin title="Sign In" />} />

            <Route path="/auth">
              <Route path="signin" element={<Signin title="Sign In" />} />
              <Route path="signup" element={<Signup title="Sign Up" />} />
              <Route
                path="verify/:verificationToken"
                element={<Verify title="Verification" />}
              />
              <Route
                path="reset-password/:resetPasswordToken"
                element={<ResetPassword title="Reset Password" />}
              />
            </Route>

            <Route
              path="/dashboard"
              element={
                <GetAuthGuard
                  component={<Dashboard title="Dashboard" />}
                  to={"/auth/signin"}
                />
              }
            >
              <Route path="batches" element={<BatchesHome title="Batches" />}>
                <Route path="" element={<Batches title="Batches" />} />
                <Route
                  path="create"
                  element={<CreateEditBatch mode={"create"} />}
                />
                <Route
                  path="edit"
                  element={<CreateEditBatch mode={"edit"} />}
                />
              </Route>
              <Route path="users" element={<UsersHome title="Users" />}>
                <Route path="" element={<Users title="Users" />} />
                <Route
                  path="create"
                  element={<CreateEditUser mode={"create"} />}
                />
                <Route path="edit" element={<CreateEditUser mode={"edit"} />} />
              </Route>
            </Route>
            <Route path="*" element={<PageNotFound title="Page Not Found" />} />
          </Routes>
        </AnimatePresence>
      </AuthenticationContextProvider>
    </SocketContextProvider>
  );
};

export default Layout;
