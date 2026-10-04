"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

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

  const [isOpen, setIsOpen] = useState(false);

  const performDelete = () => {
    startTransition(async () => {
      try {
        await deleteAction(id);
      } catch (error) {
        console.error(`Failed to delete ${entityName}:`, error);
        alert(`Failed to delete ${entityName}.`);
      } finally {
        setIsOpen(false);
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        disabled={isPending}
        title={`Delete ${entityName}`}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <ConfirmDialog
        isOpen={isOpen}
        title={`Delete ${entityName.charAt(0).toUpperCase() + entityName.slice(1)}`}
        message={`Are you sure you want to delete this ${entityName}? This action cannot be undone and will delete all associated data.`}
        onConfirm={performDelete}
        onCancel={() => setIsOpen(false)}
        isLoading={isPending}
      />
    </>
  );
}
