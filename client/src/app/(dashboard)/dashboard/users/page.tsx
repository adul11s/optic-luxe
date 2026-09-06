"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Plus, Edit2, Trash2, Shield, UserCheck, UserX } from "lucide-react";
import { Button, Card, Badge, Input, Select, Pagination, Table, TableColumn, Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui";
import { authGet, authPut, authDelete } from "@/lib/api";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { swalConfirm, swalError, swalSuccess } from "@/lib/swal";
import type { PaginatedResponse } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { User, Role } from "@/types";

export const dynamic = "force-dynamic";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "">("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const limit = 10;
  const debouncedSearch = useDebouncedValue(search, 300);

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["users", page, roleFilter, debouncedSearch],
    queryFn: () =>
      authGet<PaginatedResponse<User>>("/users", {
        params: { page, limit, role: roleFilter || undefined, search: debouncedSearch || undefined },
      }),
  });

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const updateUser = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: Partial<User> }) =>
      authPut(`/users/${userId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      swalSuccess("User updated");
    },
    onError: (err: any) => {
      swalError(err?.response?.data?.message || err?.message || "Something went wrong");
    },
  });

  const deleteUser = useMutation({
    mutationFn: (userId: string) => authDelete(`/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      swalSuccess("User deleted");
    },
    onError: (err: any) => {
      swalError(err?.response?.data?.message || err?.message || "Something went wrong");
    },
  });

  const users = (usersData?.data || []) as User[];
  const pagination = usersData?.meta || { page: 1, limit: 10, total: 0, totalPages: 0 };

  const columns: TableColumn<User>[] = [
    {
      key: "name",
      header: "User",
      render: (user) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-semibold">
            {user.name.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-brand-950">{user.name}</p>
            <p className="text-xs text-brand-500">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (user) => (
        <Badge
          variant={
            user.role === "ADMIN" ? "danger" : user.role === "STAFF" ? "warning" : "default"
          }
          size="sm"
        >
          {user.role}
        </Badge>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (user) => user.phone || "-",
    },
    {
      key: "isActive",
      header: "Status",
      render: (user) => (
        <Badge variant={user.isActive ? "success" : "danger"} dot>
          {user.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Joined",
      render: (user) => formatDate(user.createdAt),
    },
    {
      key: "actions",
      header: "",
      render: (user) => (
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              const ok = await swalConfirm({
                title: user.isActive ? "Deactivate user?" : "Activate user?",
                text: `This will ${user.isActive ? "deactivate" : "activate"} ${user.name}'s account.`,
                confirmText: "Yes, save",
              });
              if (!ok) return;
              updateUser.mutate({ userId: user.id, data: { isActive: !user.isActive } });
            }}
            className="p-2 text-brand-600 hover:bg-brand-100 rounded-lg transition-colors"
            title={user.isActive ? "Deactivate" : "Activate"}
          >
            {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
          </button>
          <button
            onClick={async () => {
              const ok = await swalConfirm({
                title: "Delete user?",
                text: "This action cannot be undone.",
                danger: true,
                confirmText: "Yes, delete",
              });
              if (!ok) return;
              deleteUser.mutate(user.id);
            }}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-brand-950">Users</h1>
          <p className="text-brand-600">Manage user accounts and staff</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
          Add Staff
        </Button>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div className="w-full sm:w-2/3">
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
              className="h-12 w-full"
            />
          </div>
          <div className="w-full sm:w-1/3">
            <Select
              options={[
                { value: "", label: "All Roles" },
                { value: "ADMIN", label: "Admin" },
                { value: "STAFF", label: "Staff" },
                { value: "CUSTOMER", label: "Customer" },
              ]}
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as Role | "");
                setPage(1);
              }}
              className="w-full h-12"
            />
          </div>
        </div>

        <Table columns={columns} data={users} isLoading={isLoading} emptyMessage="No users found" />
      </Card>

      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
        />
      )}

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
        <ModalHeader>
          <h2 className="text-lg font-semibold">Create Staff Account</h2>
        </ModalHeader>
        <ModalBody>
          <form className="space-y-4">
            <Input label="Full Name" placeholder="Staff name" />
            <Input label="Email" type="email" placeholder="staff@opticluxe.com" />
            <Input label="Phone" placeholder="08xxxxxxxxxx" />
            <Select
              label="Position"
              options={[
                { value: "WAREHOUSE", label: "Warehouse" },
                { value: "CASHIER", label: "Cashier" },
                { value: "SUPERVISOR", label: "Supervisor" },
              ]}
              placeholder="Select position"
            />
            <Input label="Password" type="password" placeholder="Min. 8 characters" />
          </form>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
            Cancel
          </Button>
          <Button>Create Staff</Button>
        </ModalFooter>
      </Modal>
    </motion.div>
  );
}