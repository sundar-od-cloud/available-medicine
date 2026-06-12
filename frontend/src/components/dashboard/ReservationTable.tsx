'use client';
import { useState } from 'react';
import { Reservation, ReservationStatus } from '@/types';
import { Button } from '@/components/ui/Button';
import { formatDateTime, getStatusColor } from '@/lib/utils';
import { reservationApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface ReservationTableProps {
  reservations: Reservation[];
  onStatusUpdate?: () => void;
  showActions?: boolean;
  userView?: boolean;
}

const STATUS_OPTIONS: ReservationStatus[] = ['confirmed', 'ready', 'completed', 'cancelled'];

export function ReservationTable({ reservations, onStatusUpdate, showActions = true, userView = false }: ReservationTableProps) {
  const [updating, setUpdating] = useState<string | null>(null);

  const handleStatusUpdate = async (id: string, status: string) => {
    setUpdating(id);
    try {
      await reservationApi.updateStatus(id, status);
      toast.success('Status updated');
      onStatusUpdate?.();
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  if (reservations.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        No reservations found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Medicine</th>
            {!userView && <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Customer</th>}
            {userView && <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Pharmacy</th>}
            <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Qty</th>
            <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Status</th>
            <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Date</th>
            {showActions && <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {reservations.map((res) => (
            <tr key={res.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className="py-3 px-4">
                <div className="font-medium text-gray-900 dark:text-gray-100">{res.medicine_name}</div>
                {res.generic_name && <div className="text-xs text-gray-500">{res.generic_name}</div>}
              </td>
              {!userView && (
                <td className="py-3 px-4">
                  <div className="text-gray-900 dark:text-gray-100">{res.user_name}</div>
                  <div className="text-xs text-gray-500">{res.user_phone}</div>
                </td>
              )}
              {userView && (
                <td className="py-3 px-4">
                  <div className="text-gray-900 dark:text-gray-100">{res.pharmacy_name}</div>
                  <div className="text-xs text-gray-500">{res.pharmacy_phone}</div>
                </td>
              )}
              <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{res.quantity}</td>
              <td className="py-3 px-4">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(res.status)}`}>
                  {res.status}
                </span>
              </td>
              <td className="py-3 px-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {formatDateTime(res.created_at)}
              </td>
              {showActions && !userView && (
                <td className="py-3 px-4">
                  {res.status !== 'completed' && res.status !== 'cancelled' && (
                    <select
                      className="text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                      value={res.status}
                      onChange={(e) => handleStatusUpdate(res.id, e.target.value)}
                      disabled={updating === res.id}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  )}
                </td>
              )}
              {showActions && userView && (
                <td className="py-3 px-4">
                  {res.status === 'pending' && (
                    <Button
                      variant="danger"
                      size="sm"
                      loading={updating === res.id}
                      onClick={() => handleStatusUpdate(res.id, 'cancelled')}
                    >
                      Cancel
                    </Button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
