import React from "react";
import { toast } from "react-toastify";
import { listMedicalConditions, deleteMedicalCondition } from "../../api/configuration.api.js";
import DataList from "../../components/DataList.jsx";
import { ConfirmModal } from "../../components/Modal.jsx";

export default function MedicalConditionList() {
  const fetchData = React.useCallback((p) => listMedicalConditions(p), []);
  const [confirm, setConfirm] = React.useState({ open: false, code: null });
  const [refresh, setRefresh] = React.useState(0);

  const handleDelete = (code) => setConfirm({ open: true, code });

  const confirmDelete = async () => {
    try {
      await deleteMedicalCondition(confirm.code);
      setConfirm({ open: false, code: null });
      setRefresh(r => r + 1);
      toast.success("Medical condition deleted.");
    } catch (e) { toast.error(String(e.message)); }
  };

  const columns = [
    { key: "condition_code",  label: "Code" },
    { key: "condition_name",  label: "Condition Name" },
    { key: "description",     label: "Description", sortable: false },
  ];

  return (
    <>
      <ConfirmModal isOpen={confirm.open} onClose={() => setConfirm({ open: false, code: null })}
        onConfirm={confirmDelete} closeOnConfirm={false} title="Delete Medical Condition"
        message="Are you sure you want to delete this medical condition?" confirmText="Delete" />
      <DataList title="Medical Conditions" fetchData={fetchData} columns={columns}
        searchPlaceholder="Search code or condition name..." itemName="conditions"
        basePath="/medical-conditions" itemKey="condition_code" onDelete={handleDelete} refreshTrigger={refresh} />
    </>
  );
}
