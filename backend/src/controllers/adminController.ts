import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database';
import { sendPharmacyApprovalEmail } from '../services/emailService';
import { notifyPharmacyApproval } from '../services/notificationService';

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [
      users,
      approvedPharmacies,
      pendingPharmacies,
      medicines,
      reservations,
      pendingReservations,
    ] = await Promise.all([
      query('SELECT COUNT(*) FROM users'),
      query("SELECT COUNT(*) FROM pharmacies WHERE status = 'approved'"),
      query("SELECT COUNT(*) FROM pharmacies WHERE status = 'pending'"),
      query('SELECT COUNT(*) FROM medicines'),
      query('SELECT COUNT(*) FROM reservations'),
      query("SELECT COUNT(*) FROM reservations WHERE status = 'pending'"),
    ]);

    const recentReservations = await query(
      `SELECT r.id, r.status, r.quantity, r.created_at,
              m.medicine_name, u.name as user_name, p.name as pharmacy_name
       FROM reservations r
       JOIN medicines m ON r.medicine_id = m.id
       JOIN users u ON r.user_id = u.id
       JOIN pharmacies p ON r.pharmacy_id = p.id
       ORDER BY r.created_at DESC
       LIMIT 10`
    );

    const topSearchedMedicines = await query(
      `SELECT sh.search_term, COUNT(*) as search_count
       FROM search_history sh
       WHERE sh.searched_at > NOW() - INTERVAL '30 days'
       GROUP BY sh.search_term
       ORDER BY search_count DESC
       LIMIT 10`
    );

    const topMedicinesByReservation = await query(
      `SELECT m.medicine_name, COUNT(r.id) as reservation_count
       FROM reservations r
       JOIN medicines m ON r.medicine_id = m.id
       GROUP BY m.id, m.medicine_name
       ORDER BY reservation_count DESC
       LIMIT 5`
    );

    const reservationsByStatus = await query(
      `SELECT status, COUNT(*) as count
       FROM reservations
       GROUP BY status`
    );

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers: parseInt(users.rows[0].count),
          approvedPharmacies: parseInt(approvedPharmacies.rows[0].count),
          pendingPharmacies: parseInt(pendingPharmacies.rows[0].count),
          totalMedicines: parseInt(medicines.rows[0].count),
          totalReservations: parseInt(reservations.rows[0].count),
          pendingReservations: parseInt(pendingReservations.rows[0].count),
        },
        recentReservations: recentReservations.rows,
        topSearchedMedicines: topSearchedMedicines.rows,
        topMedicinesByReservation: topMedicinesByReservation.rows,
        reservationsByStatus: reservationsByStatus.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = 20, role, search, verified } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let sqlQuery = `
      SELECT id, name, email, phone, role, is_verified, created_at, updated_at
      FROM users WHERE 1=1
    `;
    const params: unknown[] = [];
    let paramIndex = 1;

    if (role) {
      sqlQuery += ` AND role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

    if (search) {
      sqlQuery += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR phone ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (verified !== undefined) {
      sqlQuery += ` AND is_verified = $${paramIndex}`;
      params.push(verified === 'true');
      paramIndex++;
    }

    sqlQuery += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(Number(limit), offset);

    const result = await query(sqlQuery, params);

    const countResult = await query('SELECT COUNT(*) FROM users');

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

export const getPendingPharmacies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await query(
      `SELECT p.*, u.name as owner_name, u.email as owner_email, u.phone as owner_phone
       FROM pharmacies p
       JOIN users u ON p.owner_id = u.id
       WHERE p.status = 'pending'
       ORDER BY p.created_at ASC`
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

export const approvePharmacy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      res.status(400).json({ success: false, message: 'action must be "approve" or "reject"' });
      return;
    }

    const status = action === 'approve' ? 'approved' : 'rejected';

    const result = await query(
      'UPDATE pharmacies SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Pharmacy not found' });
      return;
    }

    const pharmacy = result.rows[0];

    // Notify owner
    const owner = await query('SELECT email, name, id FROM users WHERE id = $1', [pharmacy.owner_id]);
    if (owner.rows.length > 0) {
      const { email, id: ownerId } = owner.rows[0];
      if (email) {
        sendPharmacyApprovalEmail(email, pharmacy.name, action === 'approve').catch(console.error);
      }
      notifyPharmacyApproval(ownerId, pharmacy.name, action === 'approve').catch(console.error);
    }

    res.json({
      success: true,
      message: `Pharmacy ${status} successfully`,
      data: pharmacy,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllPharmacies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let sqlQuery = `
      SELECT p.*, u.name as owner_name, u.email as owner_email, u.phone as owner_phone
      FROM pharmacies p
      JOIN users u ON p.owner_id = u.id
      WHERE 1=1
    `;
    const params: unknown[] = [];
    let paramIndex = 1;

    if (status) {
      sqlQuery += ` AND p.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (search) {
      sqlQuery += ` AND (p.name ILIKE $${paramIndex} OR p.license_no ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    sqlQuery += ` ORDER BY p.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(Number(limit), offset);

    const result = await query(sqlQuery, params);
    const countResult = await query('SELECT COUNT(*) FROM pharmacies');

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

export const updateUserRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['user', 'pharmacy_owner', 'admin'];
    if (!validRoles.includes(role)) {
      res.status(400).json({ success: false, message: `role must be one of: ${validRoles.join(', ')}` });
      return;
    }

    const result = await query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role, updated_at',
      [role, id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM users WHERE id = $1 RETURNING id, name, email', [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.json({ success: true, message: 'User deleted', data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const getSearchAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { days = 7 } = req.query;
    const result = await query(
      `SELECT search_term, COUNT(*) as count, DATE(searched_at) as date
       FROM search_history
       WHERE searched_at > NOW() - INTERVAL '${Number(days)} days'
       GROUP BY search_term, DATE(searched_at)
       ORDER BY count DESC
       LIMIT 50`
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};
