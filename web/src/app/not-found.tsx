"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="max-w-screen-2xl mx-auto px-6 md:px-10 py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto text-center"
      >
        {/* 404 Display */}
        <div className="relative mb-12">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="font-headline text-[180px] font-black tracking-tighter leading-none text-gradient"
          >
            404
          </motion.div>
        </div>

        <h1 className="text-3xl font-headline font-bold text-on-surface mb-4 uppercase tracking-tight">
          Page Not Found
        </h1>
        <p className="text-sm font-body text-outline mb-10">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Let&apos;s get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="bg-primary-container text-on-primary-container px-8 py-4 rounded-sm font-headline text-xs uppercase tracking-widest font-bold hover:brightness-110 hover:shadow-[0_0_20px_rgba(255,85,85,0.3)] active:scale-[0.98] transition-all inline-flex items-center justify-center gap-2"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="ghost-border bg-transparent text-on-surface px-8 py-4 rounded-sm font-headline text-xs uppercase tracking-widest font-bold hover:bg-surface-bright transition-all inline-flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
        </div>

        {/* Decorative */}
        <div className="mt-16 flex justify-center gap-3">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{
                repeat: Infinity,
                duration: 1.5,
                delay: i * 0.2,
              }}
              className="h-1.5 w-1.5 rounded-full bg-primary-container"
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
