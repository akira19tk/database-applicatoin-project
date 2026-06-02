import React from "react";
import { toast } from "react-toastify";
import { listFees, deleteFee } from "../../api/configuration.api.js";
import DataList from "../../components/DataList.jsx";
import { ConfirmModal } from "../../components/Modal.jsx";

export default function FeeList() {
  const fetchData = React.useCallback((p) => listFees(p), []);
  const [confirm, setConfirm] = React.useState({ open: false, code: null });
  const [refresh, setRefresh] = React.useState(0);

  const handleDelete = (code) => setConfirm({ open: true, code });

  const confirmDelete = async () => {
    try {
      await deleteFee(confirm.code);
      setConfirm({ open: false, code: null });
      setRefresh(r => r + 1);
      toast.success("Fee deleted.");
    } catch (e) { toast.error(String(e.message)); }
  };

  const columns = [
    { key: "fee_code",  label: "Code" },
    { key: "fee_name",  label: "Fee Name" },
    { key: "fee_price", label: "Price (฿)" },
  ];

  return (
    <>
      <ConfirmModal isOpen={confirm.open} onClose={() => setConfirm({ open: false, code: null })}
        onConfirm={confirmDelete} closeOnConfirm={false} title="Delete Fee"
        message="Are you sure you want to delete this fee?" confirmText="Delete" />
      <DataList title="Fees" fetchData={fetchData} columns={columns}
        searchPlaceholder="Search code or fee name..." itemName="fees"
        basePath="/fees" itemKey="fee_code" onDelete={handleDelete} refreshTrigger={refresh} />
    </>
  );
}
