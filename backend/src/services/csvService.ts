import { parse } from 'csv-parse';
import { Readable } from 'stream';

export interface InventoryCSVRow {
  medicine_name: string;
  generic_name?: string;
  stock: number;
  price: number;
  expiry_date?: string;
}

export const parseInventoryCSV = async (buffer: Buffer): Promise<InventoryCSVRow[]> => {
  return new Promise((resolve, reject) => {
    const records: InventoryCSVRow[] = [];
    const stream = Readable.from(buffer);
    stream.pipe(
      parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
        cast: (value, context) => {
          if (context.column === 'stock') return parseInt(value, 10) || 0;
          if (context.column === 'price') return parseFloat(value) || 0;
          return value;
        },
      })
        .on('data', (row: InventoryCSVRow) => {
          if (row.medicine_name && row.stock >= 0 && row.price >= 0) {
            records.push(row);
          }
        })
        .on('end', () => resolve(records))
        .on('error', (error) => reject(error))
    );
  });
};

export const generateCSVTemplate = (): string => {
  const headers = 'medicine_name,generic_name,stock,price,expiry_date\n';
  const examples = [
    'Paracetamol 500mg,Acetaminophen,100,25.50,2025-12-31',
    'Ibuprofen 400mg,Ibuprofen,50,35.00,2026-06-30',
    'Amoxicillin 500mg,Amoxicillin,30,120.00,2025-09-15',
  ].join('\n');
  return headers + examples + '\n';
};

export const validateCSVRow = (row: InventoryCSVRow): string | null => {
  if (!row.medicine_name || row.medicine_name.trim().length === 0) {
    return 'medicine_name is required';
  }
  if (isNaN(row.stock) || row.stock < 0) {
    return 'stock must be a non-negative number';
  }
  if (isNaN(row.price) || row.price < 0) {
    return 'price must be a non-negative number';
  }
  if (row.expiry_date && isNaN(Date.parse(row.expiry_date))) {
    return 'expiry_date must be a valid date (YYYY-MM-DD)';
  }
  return null;
};
