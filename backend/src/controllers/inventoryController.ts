import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { parseInventoryCSV, generateCSVTemplate, validateCSVRow } from '../services/csvService';

export const updateInventory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { pharmacy_id, medicine_id, stock, price, expiry_date, mrp, batch_no } = req.body;

    if (!pharmacy_id || !medicine_id || stock === undefined || price === undefined) {
      res.status(400).json({ success: false, message: 'pharmacy_id, medicine_id, stock, and price are required' });
      return;
    }

    // Verify pharmacy ownership (admins bypass)
    if (req.user?.role !== 'admin') {
      const pharmacy = await query(
        'SELECT id FROM pharmacies WHERE id = $1 AND owner_id = $2',
        [pharmacy_id, req.user?.userId]
      );
      if (pharmacy.rows.length === 0) {
        res.status(403).json({ success: false, message: 'Not authorized for this pharmacy' });
        return;
      }
    }

    // Verify medicine exists
    const med = await query('SELECT id FROM medicines WHERE id = $1', [medicine_id]);
    if (med.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Medicine not found' });
      return;
    }

    const result = await query(
      `INSERT INTO inventory (pharmacy_id, medicine_id, stock, price, expiry_date, mrp, batch_no)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (pharmacy_id, medicine_id)
       DO UPDATE SET
         stock = $3,
         price = $4,
         expiry_date = $5,
         mrp = COALESCE($6, inventory.mrp),
         batch_no = COALESCE($7, inventory.batch_no),
         updated_at = NOW()
       RETURNING *`,
      [pharmacy_id, medicine_id, stock, price, expiry_date || null, mrp || null, batch_no || null]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const bulkUploadInventory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { pharmacy_id } = req.body;
    const file = (req as any).file;

    if (!pharmacy_id) {
      res.status(400).json({ success: false, message: 'pharmacy_id is required' });
      return;
    }

    if (!file) {
      res.status(400).json({ success: false, message: 'CSV file required' });
      return;
    }

    // Verify pharmacy ownership
    if (req.user?.role !== 'admin') {
      const pharmacy = await query(
        'SELECT id FROM pharmacies WHERE id = $1 AND owner_id = $2',
        [pharmacy_id, req.user?.userId]
      );
      if (pharmacy.rows.length === 0) {
        res.status(403).json({ success: false, message: 'Not authorized for this pharmacy' });
        return;
      }
    }

    const rows = await parseInventoryCSV(file.buffer);
    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const row of rows) {
      const validationError = validateCSVRow(row);
      if (validationError) {
        results.failed++;
        results.errors.push(`Row "${row.medicine_name}": ${validationError}`);
        continue;
      }

      try {
        // Find or create medicine
        let medicineResult = await query(
          'SELECT id FROM medicines WHERE medicine_name ILIKE $1',
          [row.medicine_name.trim()]
        );

        let medicineId: string;
        if (medicineResult.rows.length === 0) {
          const newMed = await query(
            'INSERT INTO medicines (medicine_name, generic_name) VALUES ($1, $2) RETURNING id',
            [row.medicine_name.trim(), row.generic_name?.trim() || null]
          );
          medicineId = newMed.rows[0].id;
        } else {
          medicineId = medicineResult.rows[0].id;
        }

        await query(
          `INSERT INTO inventory (pharmacy_id, medicine_id, stock, price, expiry_date)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (pharmacy_id, medicine_id)
           DO UPDATE SET stock = $3, price = $4, expiry_date = $5, updated_at = NOW()`,
          [pharmacy_id, medicineId, row.stock, row.price, row.expiry_date || null]
        );
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push(`Row "${row.medicine_name}": ${(err as Error).message}`);
      }
    }

    res.json({
      success: true,
      message: `Processed ${rows.length} rows`,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

export const getInventoryItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { pharmacyId, medicineId } = req.params;
    const result = await query(
      `SELECT i.*, m.medicine_name, m.generic_name, m.category, m.manufacturer
       FROM inventory i
       JOIN medicines m ON i.medicine_id = m.id
       WHERE i.pharmacy_id = $1 AND i.medicine_id = $2`,
      [pharmacyId, medicineId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Inventory item not found' });
      return;
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const deleteInventoryItem = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    // Verify ownership via join
    if (req.user?.role !== 'admin') {
      const inv = await query(
        `SELECT i.id FROM inventory i
         JOIN pharmacies p ON i.pharmacy_id = p.id
         WHERE i.id = $1 AND p.owner_id = $2`,
        [id, req.user?.userId]
      );
      if (inv.rows.length === 0) {
        res.status(403).json({ success: false, message: 'Not authorized to delete this inventory item' });
        return;
      }
    }

    const result = await query('DELETE FROM inventory WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Inventory item not found' });
      return;
    }
    res.json({ success: true, message: 'Inventory item deleted' });
  } catch (error) {
    next(error);
  }
};

export const getCSVTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const csv = generateCSVTemplate();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="inventory_template.csv"');
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

export const getLowStockItems = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { pharmacy_id, threshold = 10 } = req.query;

    if (!pharmacy_id) {
      res.status(400).json({ success: false, message: 'pharmacy_id is required' });
      return;
    }

    // Verify ownership
    if (req.user?.role !== 'admin') {
      const pharmacy = await query(
        'SELECT id FROM pharmacies WHERE id = $1 AND owner_id = $2',
        [pharmacy_id, req.user?.userId]
      );
      if (pharmacy.rows.length === 0) {
        res.status(403).json({ success: false, message: 'Not authorized for this pharmacy' });
        return;
      }
    }

    const result = await query(
      `SELECT i.*, m.medicine_name, m.generic_name, m.category
       FROM inventory i
       JOIN medicines m ON i.medicine_id = m.id
       WHERE i.pharmacy_id = $1 AND i.stock <= $2
       ORDER BY i.stock ASC`,
      [pharmacy_id, Number(threshold)]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};
