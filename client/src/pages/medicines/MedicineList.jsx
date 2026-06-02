import React from "react";
import { toast } from "react-toastify";
import { listMedicines, deleteMedicine } from "../../api/configuration.api.js";
import DataList from "../../components/DataList.jsx";
import { ConfirmModal } from "../../components/Modal.jsx";

export default function MedicineList() {
  const fetchData = React.useCallback((p) => listMedicines(p), []);
  const [confirm, setConfirm] = React.useState({ open: false, code: null });
  const [refresh, setRefresh] = React.useState(0);

  const handleDelete = (code) => setConfirm({ open: true, code });

  const confirmDelete = async () => {
    try {
      await deleteMedicine(confirm.code);
      setConfirm({ open: false, code: null });
      setRefresh(r => r + 1);
      toast.success("Medicine deleted.");
    } catch (e) { toast.error(String(e.message)); }
  };

  const columns = [
    { key: "medicine_code",  label: "Code" },
    { key: "medicine_name",  label: "Name" },
    { key: "generic_name",   label: "Generic Name" },
    { key: "medicine_type",  label: "Type" },
    { key: "unit_cost",      label: "Unit Cost (฿)" },
  ];

  return (
    <>
      <ConfirmModal isOpen={confirm.open} onClose={() => setConfirm({ open: false, code: null })}
        onConfirm={confirmDelete} closeOnConfirm={false} title="Delete Medicine"
        message="Are you sure you want to delete this medicine?" confirmText="Delete" />
      <DataList title="Medicines" fetchData={fetchData} columns={columns}
        searchPlaceholder="Search code, name, type..." itemName="medicines"
        basePath="/medicines" itemKey="medicine_code" onDelete={handleDelete} refreshTrigger={refresh} />
    </>
  );
}
