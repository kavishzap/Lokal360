"use client";

import { useMemo, useState } from "react";
import { Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { CustomerForm } from "@/components/customers/customer-form";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { useCreateRequest } from "@/hooks/use-create-request";
import { useAppStore } from "@/store/app-store";
import type { Customer } from "@/types";

export default function CustomersPage() {
  const customers = useAppStore((state) => state.customers);
  const orders = useAppStore((state) => state.orders);
  const deleteCustomer = useAppStore((state) => state.deleteCustomer);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState<Customer | null>(null);

  useCreateRequest("customer", () => {
    setEditing(null);
    setOpen(true);
  });

  const filtered = useMemo(() => {
    return [...customers]
      .sort((a, b) => a.name.localeCompare(b.name) || a.phone.localeCompare(b.phone))
      .filter((customer) => {
        if (!query) return true;
        const needle = query.toLowerCase();
        return customer.name.toLowerCase().includes(needle) || customer.phone.toLowerCase().includes(needle);
      });
  }, [customers, query]);

  const columns: DataTableColumn<Customer>[] = [
    {
      header: "Customer",
      cell: (customer) => <span className="font-medium">{customer.name || "—"}</span>,
    },
    { header: "Phone", cell: (customer) => customer.phone },
    {
      header: "Orders",
      cell: (customer) => orders.filter((order) => order.customerId === customer.id).length,
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (customer) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setEditing(customer);
              setOpen(true);
            }}
          >
            <Pencil />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setDeleting(customer)}>
            <Trash2 />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Customers"
        description="People who order, kept once for each phone number."
        actionLabel="Add customer"
        onAction={() => {
          setEditing(null);
          setOpen(true);
        }}
      />
      <div className="mb-4 max-w-sm">
        <SearchInput value={query} onChange={setQuery} placeholder="Search customers..." />
      </div>
      <DataTable
        data={filtered}
        columns={columns}
        rowKey={(customer) => customer.id}
        empty={
          <EmptyState
            icon={Users}
            title="No customers found"
            description="Add a customer, or take an order with their phone number and they appear here."
            actionLabel="Add customer"
            onAction={() => {
              setEditing(null);
              setOpen(true);
            }}
          />
        }
      />
      <CustomerForm
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setEditing(null);
        }}
        customer={editing}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(next) => !next && setDeleting(null)}
        title="Delete customer?"
        description="This removes the customer from the directory."
        onConfirm={() => {
          if (!deleting) return;
          const result = deleteCustomer(deleting.id);
          if (!result.ok) toast.error(result.error);
          else toast.success("Customer deleted");
          setDeleting(null);
        }}
      />
    </div>
  );
}
