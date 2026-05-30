import React from "react";
import { toast } from "react-toastify";
import { listSalesPersons, deleteSalesPerson } from "../../api/salesPersons.api.js";
import DataList from "../../components/DataList.jsx";
import { ConfirmModal } from "../../components/Modal.jsx";

export default function SalesPersonList() {
    const fetchData = React.useCallback((params) => listSalesPersons(params), []);
    const [confirmModal, setConfirmModal] = React.useState({ isOpen: false, id: null });
    const [refreshTrigger, setRefreshTrigger] = React.useState(0);

    const handleDelete = (id) => {
        setConfirmModal({ isOpen: true, id });
    };

    const confirmDelete = async () => {
        try {
            await deleteSalesPerson(confirmModal.id);
            setConfirmModal({ isOpen: false, id: null });
            setRefreshTrigger((t) => t + 1);
            toast.success("Sales person deleted.");
        } catch (e) {
            toast.error(String(e.message || e));
            setConfirmModal({ isOpen: false, id: null });
        }
    };

    const columns = [
        { key: "code", label: "Code" },
        { key: "name", label: "Name" },
        { key: "start_work_date", label: "Start Date", render: (v) => v ? String(v).slice(0, 10) : "-" },
    ];

    return (
        <>
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, id: null })}
                onConfirm={confirmDelete}
                closeOnConfirm={false}
                title="Delete Sales Person"
                message="Are you sure you want to delete this sales person?"
                confirmText="Delete"
            />
            <DataList
                title="Sales Persons"
                fetchData={fetchData}
                columns={columns}
                searchPlaceholder="Search code, name..."
                itemName="sales persons"
                basePath="/sales-persons"
                itemKey="code"
                onDelete={handleDelete}
                refreshTrigger={refreshTrigger}
            />
        </>
    );
}
