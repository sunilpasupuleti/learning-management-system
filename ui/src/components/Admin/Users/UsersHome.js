import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { BatchesContextProvider } from "../../../services/Batches/Batches.context";
import { useEffect } from "react";
import { UsersContextProvider } from "../../../services/users/users.context";

const UsersHome = ({ title }) => {
  useEffect(() => {
    document.title = title;
  }, []);
  return (
    <BatchesContextProvider>
      <UsersContextProvider>
        <Outlet />
      </UsersContextProvider>
    </BatchesContextProvider>
  );
};

export default UsersHome;
