'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, CheckCircle, XCircle, Download, ArrowLeft } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { inventoryApi, pharmacyApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface UploadResult {
  success: number;
  failed: number;
  errors: string[];
}

export default function BulkUploadPage() {
  const { isAuthenticated, isPharmacyOwner } = useAuth();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  if (!isAuthenticated || !isPharmacyOwner) {
    router.push('/login');
    return null;
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith('.csv') || f.name.endsWith('.xlsx'))) {
      setFile(f);
    } else {
      toast.error('Please upload a CSV or Excel file');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setResult(null);
    try {
      const phRes = await pharmacyApi.getMyPharmacy();
      const res = await inventoryApi.bulkUpload(phRes.data.data.id, file);
      setResult(res.data.data);
      toast.success(`Upload complete: ${res.data.data.success} items added`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csv = `medicine_name,stock,price,expiry_date
Paracetamol 500mg,100,15.50,2025-12-31
Amoxicillin 250mg,50,45.00,2025-06-30
`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-full">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <Link href="/inventory" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Inventory
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Bulk Upload Inventory</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Upload a CSV or Excel file to update your inventory in bulk</p>
        </div>

        <div className="max-w-2xl space-y-6">
          {/* Template Download */}
          <Card className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Download Template</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Use this template to format your data correctly</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-1" /> Download CSV
            </Button>
          </Card>

          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
              dragging
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => !file && fileRef.current?.click()}
          >
            <Upload className="h-10 w-10 text-gray-400 mx-auto mb-4" />
            {file ? (
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{file.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                <button
                  className="text-sm text-red-500 hover:text-red-700 mt-2"
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                >
                  Remove file
                </button>
              </div>
            ) : (
              <>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Drag and drop your CSV or Excel file here, or{' '}
                  <span className="text-primary-600 dark:text-primary-400 font-medium hover:underline">browse to upload</span>
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Supports CSV, XLS, XLSX up to 5MB</p>
              </>
            )}
          </div>

          {file && (
            <Button fullWidth size="lg" loading={uploading} onClick={handleUpload}>
              <Upload className="h-4 w-4 mr-2" /> Upload and Process
            </Button>
          )}

          {/* Result */}
          {result && (
            <Card padding="lg">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Upload Results</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  <div>
                    <p className="text-2xl font-bold">{result.success}</p>
                    <p className="text-xs">Successfully added</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <XCircle className="h-5 w-5" />
                  <div>
                    <p className="text-2xl font-bold">{result.failed}</p>
                    <p className="text-xs">Failed</p>
                  </div>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Errors:</p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {result.errors.map((err, i) => (
                      <p key={i} className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 px-3 py-1.5 rounded">
                        {err}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Instructions */}
          <Card padding="md">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">File Format Instructions</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <li>• <strong>medicine_name</strong> (required): Exact medicine name as in the database</li>
              <li>• <strong>stock</strong> (required): Integer quantity available</li>
              <li>• <strong>price</strong> (required): Price per unit in INR</li>
              <li>• <strong>expiry_date</strong> (optional): Format YYYY-MM-DD</li>
              <li>• First row must be the header row</li>
              <li>• Maximum 1000 rows per upload</li>
            </ul>
          </Card>
        </div>
      </main>
    </div>
  );
}
