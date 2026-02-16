"use client";

/**
 * PurchaseCard Component
 *
 * Modal overlay for confirming and executing on-chain purchases.
 * Shows product details, handles wallet signing, and displays transaction status.
 */

import { useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { usePurchase } from "@/hooks/usePurchase";
import { ProductDetails } from "@/lib/contracts/purchaseContract";
import { PURCHASE_CONFIG } from "@/lib/config/purchase";
import { X, Loader2, CheckCircle, XCircle, ExternalLink } from "lucide-react";

interface PurchaseCardProps {
  product: ProductDetails;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (txHash: string) => void;
  onError?: (error: Error) => void;
}

export function PurchaseCard({
  product,
  isOpen,
  onClose,
  onSuccess,
  onError,
}: PurchaseCardProps) {
  const { executePurchase, status, isLoading, isSuccess, error, txHash, reset } =
    usePurchase();

  // Define handleClose first so it can be used in useEffect
  const handleClose = useCallback(() => {
    if (!isLoading) {
      reset();
      onClose();
    }
  }, [isLoading, reset, onClose]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, isLoading, handleClose]);

  const handleConfirmPurchase = async () => {
    try {
      const hash = await executePurchase(product);
      onSuccess?.(hash);
    } catch (err: any) {
      onError?.(err);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  const getStatusDisplay = (): { icon: React.ReactNode; text: string; color: string } => {
    switch (status) {
      case "approving":
        return {
          icon: <Loader2 className="w-5 h-5 animate-spin" />,
          text: "Approving USDC spend...",
          color: "text-yellow-600",
        };
      case "pending":
        return {
          icon: <Loader2 className="w-5 h-5 animate-spin" />,
          text: "Waiting for wallet signature...",
          color: "text-yellow-600",
        };
      case "confirming":
        return {
          icon: <Loader2 className="w-5 h-5 animate-spin" />,
          text: "Confirming transaction...",
          color: "text-blue-600",
        };
      case "success":
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          text: "Purchase successful!",
          color: "text-green-600",
        };
      case "error":
        return {
          icon: <XCircle className="w-5 h-5" />,
          text: error?.message || "Purchase failed",
          color: "text-red-600",
        };
      default:
        return { icon: null, text: "", color: "" };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Confirm Purchase</h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          {/* Product Details */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{product.title}</h3>
              <p className="mt-1 text-sm text-gray-600">{product.description}</p>
            </div>

            {/* Price */}
            <div className="flex items-baseline justify-between py-3 border-t border-b border-gray-100">
              <span className="text-sm text-gray-500">Price</span>
              <span className="text-2xl font-bold text-gray-900">
                {product.price} {product.currency}
              </span>
            </div>

            {/* Target URL (optional) */}
            {product.targetUrl && (
              <div className="text-xs text-gray-500">
                <span>Product link: </span>
                <a
                  href={product.targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {product.targetUrl}
                </a>
              </div>
            )}
          </div>

          {/* Transaction Status */}
          {status !== "idle" && (
            <div
              className={`mt-4 p-3 rounded-lg bg-gray-50 flex items-center gap-3 ${statusDisplay.color}`}
            >
              {statusDisplay.icon}
              <span className="text-sm font-medium">{statusDisplay.text}</span>
            </div>
          )}

          {/* Transaction Hash Link */}
          {txHash && (
            <div className="mt-3">
              <a
                href={`${PURCHASE_CONFIG.explorerBaseUrl}${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                View on BaseScan
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          {isSuccess ? (
            <Button
              onClick={handleClose}
              className="w-full rounded-full bg-green-600 hover:bg-green-700 text-white"
            >
              Done
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 rounded-full"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmPurchase}
                disabled={isLoading}
                className="flex-1 rounded-full bg-[#FACC15] text-black hover:bg-[#FACC15]/90"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  "Confirm Purchase"
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
