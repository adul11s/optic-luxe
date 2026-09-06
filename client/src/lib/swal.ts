"use client";

import Swal from "sweetalert2";

const base = {
  background: "rgb(var(--brand-100))",
  color: "rgb(var(--brand-950))",
  confirmButtonColor: "#c9a962",
  confirmButtonText: "OK",
  cancelButtonColor: "rgb(var(--brand-500))",
  cancelButtonText: "Cancel",
  customClass: {
    popup: "rounded-2xl",
    confirmButton: "rounded-lg font-medium",
    cancelButton: "rounded-lg font-medium",
  },
};

export async function swalConfirm({
  title,
  text,
  danger = false,
  confirmText = "Yes, save",
}: {
  title: string;
  text: string;
  danger?: boolean;
  confirmText?: string;
}): Promise<boolean> {
  const result = await Swal.fire({
    ...base,
    icon: "warning",
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    confirmButtonColor: danger ? "#e17055" : "#c9a962",
    focusCancel: true,
  });
  return result.isConfirmed;
}

export function swalError(message: string) {
  return Swal.fire({
    ...base,
    icon: "error",
    title: "Something went wrong",
    text: message || "Please try again.",
    confirmButtonColor: "#e17055",
  });
}

export function swalSuccess(message: string) {
  return Swal.fire({
    ...base,
    icon: "success",
    title: "Success",
    text: message,
    timer: 2000,
    showConfirmButton: false,
  });
}