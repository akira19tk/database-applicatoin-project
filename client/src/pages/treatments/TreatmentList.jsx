import React from "react";
import { toast } from "react-toastify";
import { listTreatments, deleteTreatment } from "../../api/configuration.api.js";
import DataList from "../../components/DataList.jsx";
import { ConfirmModal } from "../../components/Modal.jsx";

export default function TreatmentList() {
  const fetchData = React.useCallback((p) => listTreatments(p), []);
  const [confirm, setConfirm] = React.useState({ open: false, code: null });
  const [refresh, setRefresh] = React.useState(0);

  const handleDelete = (code) => setConfirm({ open: true, code });

  const confirmDelete = async () => {
    try {
      await deleteTreatment(confirm.code);
      setConfirm({ open: false, code: null });
      setRefresh(r => r + 1);
      toast.success("Treatment deleted.");
    } catch (e) { toast.error(String(e.message)); }
  };

  const columns = [
    { key: "treatment_code", label: "Code" },
    { key: "treatment_name", label: "Treatment Name" },
    { key: "unit_cost",      label: "Unit Cost (฿)" },
  ];

  return (
    <>
      <ConfirmModal isOpen={confirm.open} onClose={() => setConfirm({ open: false, code: null })}
        onConfirm={confirmDelete} closeOnConfirm={false} title="Delete Treatment"
        message="Are you sure you want to delete this treatment?" confirmText="Delete" />
      <DataList title="Treatments" fetchData={fetchData} columns={columns}
        searchPlaceholder="Search code or treatment name..." itemName="treatments"
        basePath="/treatments" itemKey="treatment_code" onDelete={handleDelete} refreshTrigger={refresh} />
    </>
  );
}
