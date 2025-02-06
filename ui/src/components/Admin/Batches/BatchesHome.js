import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { BatchesContextProvider } from "../../../services/Batches/Batches.context";
import { useEffect } from "react";

const BatchesHome = ({ title }) => {
  useEffect(() => {
    document.title = title;
  }, []);
  return (
    <BatchesContextProvider>
      <Outlet />
    </BatchesContextProvider>
  );
};

export default BatchesHome;
