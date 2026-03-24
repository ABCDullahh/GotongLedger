"use client";

import { motion } from "framer-motion";
import { type LucideIcon, FileCheck, Heart, Receipt, Database } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}
    >
      {/* Icon */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-primary/5 rounded-full blur-2xl" />
        <div className="relative w-20 h-20 rounded-sm bg-surface-container-high ghost-border flex items-center justify-center">
          <Icon className="h-8 w-8 text-outline" />
        </div>
      </div>

      <h3 className="text-xl font-headline font-bold mb-3 text-on-surface">{title}</h3>
      <p className="text-sm font-body text-outline max-w-md mb-8">{description}</p>

      {action && (
        action.href ? (
          <Link
            href={action.href}
            className="bg-primary-container text-on-primary-container px-8 py-3 rounded-sm font-headline text-xs uppercase tracking-widest font-bold hover:brightness-110 active:scale-[0.98] transition-all"
          >
            {action.label}
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            className="bg-primary-container text-on-primary-container px-8 py-3 rounded-sm font-headline text-xs uppercase tracking-widest font-bold hover:brightness-110 active:scale-[0.98] transition-all"
          >
            {action.label}
          </button>
        )
      )}
    </motion.div>
  );
}

// Preset empty states for common scenarios
export function NoCampaignsState({ filtered = false }: { filtered?: boolean }) {
  return (
    <EmptyState
      icon={FileCheck}
      title={filtered ? "No Matching Campaigns" : "No Campaigns Yet"}
      description={
        filtered
          ? "Try adjusting your search or filters to find campaigns."
          : "Be the first to create a transparent donation campaign and start making a difference!"
      }
      action={
        filtered
          ? undefined
          : {
              label: "Create Campaign",
              href: "/admin",
            }
      }
    />
  );
}

export function NoDonationsState() {
  return (
    <EmptyState
      icon={Heart}
      title="No Donations Yet"
      description="This campaign hasn't received any donations yet. Be the first to contribute and help make a difference!"
    />
  );
}

export function NoExpensesState() {
  return (
    <EmptyState
      icon={Receipt}
      title="No Expenses Recorded"
      description="No expenses have been recorded for this campaign yet. Check back later for transparency updates."
    />
  );
}

export function NoDataState() {
  return (
    <EmptyState
      icon={Database}
      title="No Data Available"
      description="There's no data to display at the moment. This could be because the blockchain is still syncing or there are no records yet."
    />
  );
}
