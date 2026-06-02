import React from "react";
import { toast } from "react-toastify";
import { listDepartments, deleteDepartment } from "../../api/configuration.api.js";
import DataList from "../../components/DataList.jsx";
import { ConfirmModal } from "../../components/Modal.jsx";

export default function DepartmentList() {
  const fetchData = React.useCallback((p) => listDepartments(p), []);
  const [confirm, setConfirm] = React.useState({ open: false, code: null });
  const [refresh, setRefresh] = React.useState(0);

  const handleDelete = (code) => setConfirm({ open: true, code });

  const confirmDelete = async () => {
    try {
      await deleteDepartment(confirm.code);
      setConfirm({ open: false, code: null });
      setRefresh(r => r + 1);
      toast.success("Department deleted.");
    } catch (e) { toast.error(String(e.message)); }
  };

  const columns = [
    { key: "department_code",        label: "Code" },
    { key: "department_name",        label: "Department Name" },
    { key: "location_description",   label: "Location", sortable: false },
  ];

  return (
    <>
      <ConfirmModal isOpen={confirm.open} onClose={() => setConfirm({ open: false, code: null })}
        onConfirm={confirmDelete} closeOnConfirm={false} title="Delete Department"
        message="Are you sure you want to delete this department?" confirmText="Delete" />
      <DataList title="Departments" fetchData={fetchData} columns={columns}
        searchPlaceholder="Search code or department name..." itemName="departments"
        basePath="/departments" itemKey="department_code" onDelete={handleDelete} refreshTrigger={refresh} />
    </>
  );
}
