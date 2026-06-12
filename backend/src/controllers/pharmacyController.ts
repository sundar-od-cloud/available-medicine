import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { haversineDistance } from '../utils/geoUtils';

export const registerPharmacy = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, license_no, gst_no, address, city, state, pincode, latitude, longitude, phone, email, description, opening_time, closing_time, is_24_hours } = req.body;

    if (!name || !license_no || !address || !latitude || !longitude || !phone) {
      res.status(400).json({ success: false, message: 'name, license_no, address, latitude, longitude, and phone are required' });
      return;
    }

    const existing = await query('SELECT id FROM pharmacies WHERE license_no = $1', [license_no]);
    if (existing.rows.length > 0) {
      res.status(409).json({ success: false, message: 'License number already registered' });
      return;
    }

    const result = await query(
      `INSERT INTO pharmacies
         (owner_id, name, license_no, gst_no, address, city, state, pincode,
          latitude, longitude, phone, email, description, opening_time, closing_time, is_24_hours)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [
        req.user?.userId, name, license_no, gst_no || null, address,
        city || null, state || null, pincode || null,
        latitude, longitude, phone, email || null, description || null,
        opening_time || null, closing_time || null, is_24_hours ?? false,
      ]
    );

    // Update user role to pharmacy_owner if not already admin
    if (req.user?.role === 'user') {
      await query('UPDATE users SET role = $1 WHERE id = $2', ['pharmacy_owner', req.user?.userId]);
    }

    res.status(201).json({
      success: true,
      message: 'Pharmacy registered successfully, pending admin approval',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

export const getPharmacyById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT p.*, u.name as owner_name, u.email as owner_email
       FROM pharmacies p
       JOIN users u ON p.owner_id = u.id
       WHERE p.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Pharmacy not found' });
      return;
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const getNearbyPharmacies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { lat, lng, radius = 10, page = 1, limit = 20, medicine_id } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    if (!lat || !lng) {
      res.status(400).json({ success: false, message: 'Latitude and longitude required' });
      return;
    }

    let sqlQuery = `
      SELECT p.*,
        ROUND((
          6371 * acos(
            LEAST(1.0,
              cos(radians($1)) * cos(radians(p.latitude)) *
              cos(radians(p.longitude) - radians($2)) +
              sin(radians($1)) * sin(radians(p.latitude))
            )
          )
        )::numeric, 2) AS distance_km
      FROM pharmacies p
    `;
    const params: unknown[] = [Number(lat), Number(lng), Number(radius)];
    let paramIndex = 4;

    if (medicine_id) {
      sqlQuery += `
        JOIN inventory i ON p.id = i.pharmacy_id AND i.medicine_id = $${paramIndex} AND i.stock > 0
      `;
      params.push(medicine_id);
      paramIndex++;
    }

    sqlQuery += `
      WHERE p.status = 'approved'
      HAVING ROUND((
        6371 * acos(
          LEAST(1.0,
            cos(radians($1)) * cos(radians(p.latitude)) *
            cos(radians(p.longitude) - radians($2)) +
            sin(radians($1)) * sin(radians(p.latitude))
          )
        )
      )::numeric, 2) <= $3
      ORDER BY distance_km ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(Number(limit), offset);

    const result = await query(sqlQuery, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

export const getPharmacyInventory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, search, category, in_stock } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Verify pharmacy exists
    const pharmCheck = await query('SELECT id FROM pharmacies WHERE id = $1', [id]);
    if (pharmCheck.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Pharmacy not found' });
      return;
    }

    let sqlQuery = `
      SELECT i.*, m.medicine_name, m.generic_name, m.composition, m.category,
             m.manufacturer, m.dosage_form, m.strength, m.prescription_required
      FROM inventory i
      JOIN medicines m ON i.medicine_id = m.id
      WHERE i.pharmacy_id = $1
    `;
    const params: unknown[] = [id];
    let paramIndex = 2;

    if (search) {
      sqlQuery += ` AND (m.medicine_name ILIKE $${paramIndex} OR m.generic_name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (category) {
      sqlQuery += ` AND m.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (in_stock === 'true') {
      sqlQuery += ` AND i.stock > 0`;
    }

    sqlQuery += ` ORDER BY m.medicine_name LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(Number(limit), offset);

    const result = await query(sqlQuery, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

export const getMyPharmacy = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await query(
      'SELECT * FROM pharmacies WHERE owner_id = $1 ORDER BY created_at DESC',
      [req.user?.userId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'No pharmacy found for this user' });
      return;
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const updatePharmacy = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, address, city, state, pincode, latitude, longitude, phone, email, gst_no, description, opening_time, closing_time, is_24_hours } = req.body;

    // Verify ownership (admins can update any)
    if (req.user?.role !== 'admin') {
      const pharmacy = await query('SELECT id FROM pharmacies WHERE id = $1 AND owner_id = $2', [id, req.user?.userId]);
      if (pharmacy.rows.length === 0) {
        res.status(403).json({ success: false, message: 'Not authorized to update this pharmacy' });
        return;
      }
    }

    const result = await query(
      `UPDATE pharmacies SET
        name = COALESCE($1, name),
        address = COALESCE($2, address),
        city = COALESCE($3, city),
        state = COALESCE($4, state),
        pincode = COALESCE($5, pincode),
        latitude = COALESCE($6, latitude),
        longitude = COALESCE($7, longitude),
        phone = COALESCE($8, phone),
        email = COALESCE($9, email),
        gst_no = COALESCE($10, gst_no),
        description = COALESCE($11, description),
        opening_time = COALESCE($12, opening_time),
        closing_time = COALESCE($13, closing_time),
        is_24_hours = COALESCE($14, is_24_hours)
       WHERE id = $15 RETURNING *`,
      [
        name || null, address || null, city || null, state || null, pincode || null,
        latitude ?? null, longitude ?? null, phone || null, email || null,
        gst_no || null, description || null, opening_time || null,
        closing_time || null, is_24_hours ?? null, id,
      ]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Pharmacy not found' });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const searchPharmacies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { q, city, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let sqlQuery = `
      SELECT p.*, u.name as owner_name
      FROM pharmacies p
      JOIN users u ON p.owner_id = u.id
      WHERE p.status = 'approved'
    `;
    const params: unknown[] = [];
    let paramIndex = 1;

    if (q) {
      sqlQuery += ` AND (p.name ILIKE $${paramIndex} OR p.address ILIKE $${paramIndex})`;
      params.push(`%${q}%`);
      paramIndex++;
    }

    if (city) {
      sqlQuery += ` AND p.city ILIKE $${paramIndex}`;
      params.push(`%${city}%`);
      paramIndex++;
    }

    sqlQuery += ` ORDER BY p.rating DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(Number(limit), offset);

    const result = await query(sqlQuery, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};
