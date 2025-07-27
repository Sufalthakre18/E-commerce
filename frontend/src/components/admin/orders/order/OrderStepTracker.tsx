
'use client';

import {
  CheckCircle,
  XCircle,
  RotateCcw,
  Truck,
  Package,
} from 'lucide-react';
import React from 'react';

type OrderStatus =
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED';

const steps = [
  { key: 'PROCESSING', label: 'Processing', icon: RotateCcw },
  { key: 'SHIPPED', label: 'Shipped', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle },
];

const statusColor = {
  completed: 'bg-indigo-600 text-white',
  pending: 'bg-gray-200 text-gray-500',
  cancelled: 'bg-red-500 text-white',
  returned: 'bg-yellow-500 text-white',
};

const getCurrentStepIndex = (status: OrderStatus) => {
  switch (status) {
    case 'PROCESSING':
      return 0;
    case 'SHIPPED':
      return 1;
    case 'DELIVERED':
      return 2;
    case 'CANCELLED':
    case 'RETURNED':
      return -1;
    default:
      return -1;
  }
};

export const OrderStepTracker = ({ status }: { status: OrderStatus }) => {
  const currentStep = getCurrentStepIndex(status);
  const isFinal = status === 'CANCELLED' || status === 'RETURNED';

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4">Order Status</h3>

      {!isFinal ? (
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index <= currentStep;

            return (
              <div className="flex-1 flex items-center gap-2 sm:gap-3" key={step.key}>
                <div
                  className={`rounded-full p-2 sm:p-3 transition ${
                    isCompleted
                      ? statusColor.completed
                      : statusColor.pending
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span
                  className={`text-sm sm:text-base ${
                    isCompleted ? 'text-indigo-700 font-medium' : 'text-gray-500'
                  }`}
                >
                  {step.label}
                </span>
                {index < steps.length - 1 && (
                  <div className="hidden sm:block flex-1 h-0.5 bg-gray-300 ml-2" />
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div
            className={`rounded-full p-3 ${
              status === 'CANCELLED'
                ? statusColor.cancelled
                : statusColor.returned
            }`}
          >
            {status === 'CANCELLED' ? (
              <XCircle className="w-5 h-5" />
            ) : (
              <RotateCcw className="w-5 h-5" />
            )}
          </div>
          <span className="text-base font-medium capitalize">
            Order {status.toLowerCase()}
          </span>
        </div>
      )}
    </div>
  );
};
