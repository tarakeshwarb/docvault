"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function DeleteButton({
  id,
  entityName,
  deleteAction,
}: {
  id: string;
  entityName: string;
  deleteAction: (id: string) => Promise<void>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    const isConfirmed = window.confirm(
      `Are you sure you want to delete this ${entityName}? This action cannot be undone and will delete all associated data.`
    );

    if (isConfirmed) {
      startTransition(async () => {
        try {
          await deleteAction(id);
        } catch (error) {
          console.error(`Failed to delete ${entityName}:`, error);
          alert(`Failed to delete ${entityName}.`);
        }
      });
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      title={`Delete ${entityName}`}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
