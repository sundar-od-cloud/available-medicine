import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { sendReservationConfirmation } from '../services/emailService';
import { notifyReservationStatus } from '../services/notificationService';

export const createReservation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { pharmacy_id, medicine_id, quantity = 1, notes } = req.body;

    if (!pharmacy_id || !medicine_id) {
      res.status(400).json({ success: false, message: 'pharmacy_id and medicine_id are required' });
      return;
    }

    if (quantity < 1) {
      res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
      return;
    }

    // Verify pharmacy is approved
    const pharmacy = await query(
      "SELECT id, name FROM pharmacies WHERE id = $1 AND status = 'approved'",
      [pharmacy_id]
    );
    if (pharmacy.rows.length === 0) {
      res.status(400).json({ success: false, message: 'Pharmacy not found or not approved' });
      return;
    }

    // Check inventory
    const inventory = await query(
      'SELECT * FROM inventory WHERE pharmacy_id = $1 AND medicine_id = $2',
      [pharmacy_id, medicine_id]
    );

    if (inventory.rows.length === 0) {
      res.status(400).json({ success: false, message: 'Medicine not available at this pharmacy' });
      return;
    }

    if (inventory.rows[0].stock < quantity) {
      res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${inventory.rows[0].stock}`,
      });
      return;
    }

    const result = await query(
      `INSERT INTO reservations (user_id, pharmacy_id, medicine_id, quantity, notes)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user?.userId, pharmacy_id, medicine_id, quantity, notes || null]
    );

    const reservation = result.rows[0];

    // Get details for email notification
    const details = await query(
      `SELECT m.medicine_name, p.name as pharmacy_name, u.email
       FROM medicines m, pharmacies p, users u
       WHERE m.id = $1 AND p.id = $2 AND u.id = $3`,
      [medicine_id, pharmacy_id, req.user?.userId]
    );

    if (details.rows.length > 0) {
      const { medicine_name, pharmacy_name, email } = details.rows[0];
      if (email) {
        sendReservationConfirmation(email, {
          medicineName: medicine_name,
          pharmacyName: pharmacy_name,
          quantity,
          reservationId: reservation.id,
        }).catch(console.error);
      }
    }

    res.status(201).json({ success: true, message: 'Reservation created', data: reservation });
  } catch (error) {
    next(error);
  }
};

export const getReservationById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT r.*,
              m.medicine_name, m.generic_name, m.dosage_form, m.strength,
              p.name as pharmacy_name, p.address as pharmacy_address, p.phone as pharmacy_phone,
              p.latitude as pharmacy_lat, p.longitude as pharmacy_lng,
              u.name as user_name, u.phone as user_phone, u.email as user_email,
              i.price as unit_price
       FROM reservations r
       JOIN medicines m ON r.medicine_id = m.id
       JOIN pharmacies p ON r.pharmacy_id = p.id
       JOIN users u ON r.user_id = u.id
       LEFT JOIN inventory i ON i.pharmacy_id = r.pharmacy_id AND i.medicine_id = r.medicine_id
       WHERE r.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Reservation not found' });
      return;
    }

    const reservation = result.rows[0];

    // Only allow: the user who made it, the pharmacy owner, or admin
    const isOwner = reservation.user_id === req.user?.userId;
    const isAdmin = req.user?.role === 'admin';
    const pharmacyOwner = await query(
      'SELECT owner_id FROM pharmacies WHERE id = $1',
      [reservation.pharmacy_id]
    );
    const isPharmacyOwner = pharmacyOwner.rows[0]?.owner_id === req.user?.userId;

    if (!isOwner && !isAdmin && !isPharmacyOwner) {
      res.status(403).json({ success: false, message: 'Not authorized to view this reservation' });
      return;
    }

    res.json({ success: true, data: reservation });
  } catch (error) {
    next(error);
  }
};

export const updateReservationStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, cancellation_reason } = req.body;

    const validStatuses = ['confirmed', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ success: false, message: `Status must be one of: ${validStatuses.join(', ')}` });
      return;
    }

    const reservation = await query(
      `SELECT r.*, p.owner_id, u.email as user_email, m.medicine_name
       FROM reservations r
       JOIN pharmacies p ON r.pharmacy_id = p.id
       JOIN users u ON r.user_id = u.id
       JOIN medicines m ON r.medicine_id = m.id
       WHERE r.id = $1`,
      [id]
    );

    if (reservation.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Reservation not found' });
      return;
    }

    const resData = reservation.rows[0];

    // Authorization: user can only cancel their own; pharmacy owner can confirm/ready/complete
    const isAdmin = req.user?.role === 'admin';
    const isPharmacyOwner = resData.owner_id === req.user?.userId;
    const isUser = resData.user_id === req.user?.userId;

    if (!isAdmin && !isPharmacyOwner && !(isUser && status === 'cancelled')) {
      res.status(403).json({ success: false, message: 'Not authorized to update this reservation' });
      return;
    }

    // Build extra timestamp columns
    const timestampCol: Record<string, string> = {
      confirmed: 'confirmed_at',
      completed: 'completed_at',
      cancelled: 'cancelled_at',
    };
    const tsColumn = timestampCol[status];

    let updateQuery: string;
    let updateParams: unknown[];

    if (tsColumn) {
      updateQuery = `
        UPDATE reservations
        SET status = $1,
            ${tsColumn} = NOW(),
            cancellation_reason = CASE WHEN $1 = 'cancelled' THEN $2 ELSE cancellation_reason END
        WHERE id = $3 RETURNING *
      `;
      updateParams = [status, cancellation_reason || null, id];
    } else {
      updateQuery = 'UPDATE reservations SET status = $1 WHERE id = $2 RETURNING *';
      updateParams = [status, id];
    }

    const result = await query(updateQuery, updateParams);

    // Reduce stock when confirmed
    if (status === 'confirmed') {
      await query(
        'UPDATE inventory SET stock = GREATEST(stock - $1, 0) WHERE pharmacy_id = $2 AND medicine_id = $3',
        [resData.quantity, resData.pharmacy_id, resData.medicine_id]
      );
    }

    // Send in-app notification
    await notifyReservationStatus(resData.user_id, id, status, resData.medicine_name);

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const getUserReservations = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let sqlQuery = `
      SELECT r.*,
             m.medicine_name, m.generic_name,
             p.name as pharmacy_name, p.address as pharmacy_address, p.phone as pharmacy_phone
      FROM reservations r
      JOIN medicines m ON r.medicine_id = m.id
      JOIN pharmacies p ON r.pharmacy_id = p.id
      WHERE r.user_id = $1
    `;
    const params: unknown[] = [req.user?.userId];
    let paramIndex = 2;

    if (status) {
      sqlQuery += ` AND r.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    sqlQuery += ` ORDER BY r.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(Number(limit), offset);

    const result = await query(sqlQuery, params);

    const countResult = await query(
      `SELECT COUNT(*) FROM reservations WHERE user_id = $1 ${status ? "AND status = $2" : ""}`,
      status ? [req.user?.userId, status] : [req.user?.userId]
    );

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

export const getPharmacyReservations = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { pharmacy_id } = req.params;
    const { page = 1, limit = 20, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

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

    let sqlQuery = `
      SELECT r.*,
             m.medicine_name, m.generic_name,
             u.name as user_name, u.phone as user_phone, u.email as user_email
      FROM reservations r
      JOIN medicines m ON r.medicine_id = m.id
      JOIN users u ON r.user_id = u.id
      WHERE r.pharmacy_id = $1
    `;
    const params: unknown[] = [pharmacy_id];
    let paramIndex = 2;

    if (status) {
      sqlQuery += ` AND r.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    sqlQuery += ` ORDER BY r.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(Number(limit), offset);

    const result = await query(sqlQuery, params);

    const countResult = await query(
      `SELECT COUNT(*) FROM reservations WHERE pharmacy_id = $1 ${status ? "AND status = $2" : ""}`,
      status ? [pharmacy_id, status] : [pharmacy_id]
    );

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
