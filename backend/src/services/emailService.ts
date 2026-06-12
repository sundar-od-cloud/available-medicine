import nodemailer from 'nodemailer';

const createTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER &&
      process.env.SMTP_USER !== 'your-email@gmail.com') {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  // Ethereal test account for development
  return null;
};

export const sendWelcomeEmail = async (email: string, name: string): Promise<void> => {
  const transporter = createTransporter();
  if (!transporter) {
    console.log(`[Email Service] Welcome email to: ${email}, Name: ${name}`);
    return;
  }
  try {
    await transporter.sendMail({
      from: process.env.FROM_EMAIL || 'noreply@availablemedicine.com',
      to: email,
      subject: 'Welcome to Available Medicine',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #0d9488;">Welcome to Available Medicine!</h1>
          <p>Hi ${name},</p>
          <p>Thank you for joining Available Medicine. You can now search for medicines and find pharmacies near you.</p>
          <p>Best regards,<br>The Available Medicine Team</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
};

export const sendReservationConfirmation = async (
  email: string,
  reservationDetails: {
    medicineName: string;
    pharmacyName: string;
    quantity: number;
    reservationId: string;
  }
): Promise<void> => {
  const transporter = createTransporter();
  if (!transporter) {
    console.log(`[Email Service] Reservation confirmation to: ${email}`, reservationDetails);
    return;
  }
  try {
    await transporter.sendMail({
      from: process.env.FROM_EMAIL || 'noreply@availablemedicine.com',
      to: email,
      subject: 'Reservation Confirmed - Available Medicine',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #0d9488;">Reservation Confirmed!</h1>
          <p>Your reservation has been placed successfully.</p>
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Reservation Details:</h3>
            <p><strong>Medicine:</strong> ${reservationDetails.medicineName}</p>
            <p><strong>Pharmacy:</strong> ${reservationDetails.pharmacyName}</p>
            <p><strong>Quantity:</strong> ${reservationDetails.quantity}</p>
            <p><strong>Reservation ID:</strong> ${reservationDetails.reservationId}</p>
          </div>
          <p>Please visit the pharmacy to collect your medicine.</p>
          <p>Best regards,<br>The Available Medicine Team</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Error sending reservation email:', error);
  }
};

export const sendPharmacyApprovalEmail = async (
  email: string,
  pharmacyName: string,
  approved: boolean
): Promise<void> => {
  const transporter = createTransporter();
  const subject = approved ? 'Pharmacy Approved' : 'Pharmacy Application Update';
  const status = approved ? 'approved' : 'rejected';
  if (!transporter) {
    console.log(`[Email Service] Pharmacy ${status} email to: ${email}`);
    return;
  }
  try {
    await transporter.sendMail({
      from: process.env.FROM_EMAIL || 'noreply@availablemedicine.com',
      to: email,
      subject: `${subject} - Available Medicine`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #0d9488;">${subject}</h1>
          <p>Your pharmacy <strong>${pharmacyName}</strong> has been <strong>${status}</strong>.</p>
          ${approved
            ? '<p>You can now manage your inventory and accept reservations.</p>'
            : '<p>Please contact support for more information.</p>'
          }
          <p>Best regards,<br>The Available Medicine Team</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Error sending pharmacy approval email:', error);
  }
};

export const sendPasswordResetEmail = async (email: string, resetLink: string): Promise<void> => {
  const transporter = createTransporter();
  if (!transporter) {
    console.log(`[Email Service] Password reset email to: ${email}, Link: ${resetLink}`);
    return;
  }
  try {
    await transporter.sendMail({
      from: process.env.FROM_EMAIL || 'noreply@availablemedicine.com',
      to: email,
      subject: 'Password Reset - Available Medicine',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #0d9488;">Password Reset Request</h1>
          <p>Click the link below to reset your password. This link expires in 1 hour.</p>
          <a href="${resetLink}" style="background: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
            Reset Password
          </a>
          <p>If you did not request a password reset, please ignore this email.</p>
          <p>Best regards,<br>The Available Medicine Team</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Error sending password reset email:', error);
  }
};
