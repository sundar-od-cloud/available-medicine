import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const searchMedicines = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { q, category, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let sqlQuery = `
      SELECT m.*,
        COUNT(DISTINCT i.pharmacy_id) FILTER (WHERE i.stock > 0 AND p.status = 'approved') as pharmacy_count,
        MIN(i.price) FILTER (WHERE i.stock > 0 AND p.status = 'approved') as min_price,
        MAX(i.price) FILTER (WHERE i.stock > 0 AND p.status = 'approved') as max_price
      FROM medicines m
      LEFT JOIN inventory i ON m.id = i.medicine_id
      LEFT JOIN pharmacies p ON i.pharmacy_id = p.id
      WHERE 1=1
    `;
    const params: unknown[] = [];
    let paramIndex = 1;

    if (q) {
      sqlQuery += ` AND (
        m.medicine_name ILIKE $${paramIndex} OR
        m.generic_name ILIKE $${paramIndex} OR
        m.composition ILIKE $${paramIndex} OR
        m.manufacturer ILIKE $${paramIndex}
      )`;
      params.push(`%${q}%`);
      paramIndex++;
    }

    if (category) {
      sqlQuery += ` AND m.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    sqlQuery += ` GROUP BY m.id ORDER BY m.medicine_name LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(Number(limit), offset);

    const result = await query(sqlQuery, params);

    // Count total
    let countQuery = `SELECT COUNT(*) FROM medicines m WHERE 1=1`;
    const countParams: unknown[] = [];
    let countIndex = 1;
    if (q) {
      countQuery += ` AND (m.medicine_name ILIKE $${countIndex} OR m.generic_name ILIKE $${countIndex} OR m.composition ILIKE $${countIndex})`;
      countParams.push(`%${q}%`);
      countIndex++;
    }
    if (category) {
      countQuery += ` AND m.category = $${countIndex}`;
      countParams.push(category);
    }
    const countResult = await query(countQuery, countParams);

    // Save search history
    const authReq = req as AuthRequest;
    if (q) {
      if (authReq.user?.userId) {
        await query(
          'INSERT INTO search_history (user_id, search_term) VALUES ($1, $2)',
          [authReq.user.userId, q]
        );
      } else {
        await query('INSERT INTO search_history (search_term) VALUES ($1)', [q]);
      }
    }

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMedicineById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM medicines WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Medicine not found' });
      return;
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const getAlternatives = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const medicine = await query('SELECT * FROM medicines WHERE id = $1', [id]);
    if (medicine.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Medicine not found' });
      return;
    }
    const med = medicine.rows[0];

    const alternatives = await query(
      `SELECT m.*,
         COUNT(DISTINCT i.pharmacy_id) FILTER (WHERE i.stock > 0) as pharmacy_count,
         MIN(i.price) FILTER (WHERE i.stock > 0) as min_price
       FROM medicines m
       LEFT JOIN inventory i ON m.id = i.medicine_id
       WHERE m.id != $1
         AND (
           (m.generic_name IS NOT NULL AND m.generic_name ILIKE $2) OR
           (m.composition IS NOT NULL AND m.composition ILIKE $3)
         )
       GROUP BY m.id
       ORDER BY pharmacy_count DESC NULLS LAST
       LIMIT 10`,
      [id, `%${med.generic_name || ''}%`, `%${med.generic_name || ''}%`]
    );

    res.json({ success: true, data: alternatives.rows });
  } catch (error) {
    next(error);
  }
};

export const getMedicineAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { lat, lng, radius = 10 } = req.query;

    // Verify medicine exists
    const medCheck = await query('SELECT id FROM medicines WHERE id = $1', [id]);
    if (medCheck.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Medicine not found' });
      return;
    }

    let sqlQuery: string;
    let params: unknown[];

    if (lat && lng) {
      sqlQuery = `
        SELECT
          p.id, p.name, p.address, p.phone, p.latitude, p.longitude,
          p.rating, p.total_ratings,
          i.stock, i.price, i.expiry_date,
          ROUND((
            6371 * acos(
              LEAST(1.0,
                cos(radians($2)) * cos(radians(p.latitude)) *
                cos(radians(p.longitude) - radians($3)) +
                sin(radians($2)) * sin(radians(p.latitude))
              )
            )
          )::numeric, 2) AS distance_km
        FROM inventory i
        JOIN pharmacies p ON i.pharmacy_id = p.id
        WHERE i.medicine_id = $1
          AND i.stock > 0
          AND p.status = 'approved'
        HAVING ROUND((
          6371 * acos(
            LEAST(1.0,
              cos(radians($2)) * cos(radians(p.latitude)) *
              cos(radians(p.longitude) - radians($3)) +
              sin(radians($2)) * sin(radians(p.latitude))
            )
          )
        )::numeric, 2) <= $4
        ORDER BY distance_km ASC
      `;
      params = [id, Number(lat), Number(lng), Number(radius)];
    } else {
      sqlQuery = `
        SELECT
          p.id, p.name, p.address, p.phone, p.latitude, p.longitude,
          p.rating, p.total_ratings,
          i.stock, i.price, i.expiry_date
        FROM inventory i
        JOIN pharmacies p ON i.pharmacy_id = p.id
        WHERE i.medicine_id = $1
          AND i.stock > 0
          AND p.status = 'approved'
        ORDER BY i.price ASC
      `;
      params = [id];
    }

    const result = await query(sqlQuery, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

export const getCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await query(
      `SELECT category, COUNT(*) as medicine_count
       FROM medicines
       WHERE category IS NOT NULL
       GROUP BY category
       ORDER BY category`
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

export const createMedicine = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      medicine_name,
      generic_name,
      composition,
      manufacturer,
      category,
      alternatives,
      dosage_form,
      strength,
      prescription_required,
      description,
      side_effects,
    } = req.body;

    if (!medicine_name) {
      res.status(400).json({ success: false, message: 'medicine_name is required' });
      return;
    }

    const result = await query(
      `INSERT INTO medicines
         (medicine_name, generic_name, composition, manufacturer, category,
          alternatives, dosage_form, strength, prescription_required, description, side_effects)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        medicine_name,
        generic_name || null,
        composition || null,
        manufacturer || null,
        category || null,
        JSON.stringify(alternatives || []),
        dosage_form || null,
        strength || null,
        prescription_required ?? false,
        description || null,
        side_effects || null,
      ]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const updateMedicine = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      medicine_name,
      generic_name,
      composition,
      manufacturer,
      category,
      alternatives,
      dosage_form,
      strength,
      prescription_required,
      description,
      side_effects,
    } = req.body;

    const result = await query(
      `UPDATE medicines SET
        medicine_name = COALESCE($1, medicine_name),
        generic_name = COALESCE($2, generic_name),
        composition = COALESCE($3, composition),
        manufacturer = COALESCE($4, manufacturer),
        category = COALESCE($5, category),
        alternatives = COALESCE($6, alternatives),
        dosage_form = COALESCE($7, dosage_form),
        strength = COALESCE($8, strength),
        prescription_required = COALESCE($9, prescription_required),
        description = COALESCE($10, description),
        side_effects = COALESCE($11, side_effects)
       WHERE id = $12 RETURNING *`,
      [
        medicine_name || null,
        generic_name || null,
        composition || null,
        manufacturer || null,
        category || null,
        alternatives ? JSON.stringify(alternatives) : null,
        dosage_form || null,
        strength || null,
        prescription_required ?? null,
        description || null,
        side_effects || null,
        id,
      ]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Medicine not found' });
      return;
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const deleteMedicine = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM medicines WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Medicine not found' });
      return;
    }
    res.json({ success: true, message: 'Medicine deleted' });
  } catch (error) {
    next(error);
  }
};

export const getPopularMedicines = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { limit = 10 } = req.query;
    const result = await query(
      `SELECT m.*, COUNT(sh.id) as search_count
       FROM medicines m
       LEFT JOIN search_history sh ON m.id = sh.medicine_id
       GROUP BY m.id
       ORDER BY search_count DESC, m.medicine_name ASC
       LIMIT $1`,
      [Number(limit)]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};
