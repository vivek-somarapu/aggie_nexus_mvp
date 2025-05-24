"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
interface ProfileCompletionBannerProps {
  visible: boolean;
}

/**
 * A dismiss‑less banner prompting the user to finish their profile.
 */
export default function ProfileCompletionBanner({
  visible,
}: ProfileCompletionBannerProps) {
  const router = useRouter();

  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.div
          key="completion-banner"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.3 }}
          className="fixed top-20 right-6 z-50 max-w-md w-full"
        >
          <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg rounded-lg">
            <AlertDescription className="flex justify-between items-center gap-4">
              <div className="flex-1">
                <p className="font-medium text-blue-800 dark:text-blue-300">
                  Your profile is incomplete
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Complete your profile to connect with others and showcase your
                  skills.
                </p>
              </div>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => router.push("/profile/setup")}
              >
                Complete
              </Button>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
