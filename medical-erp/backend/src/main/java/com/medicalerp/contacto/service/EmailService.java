package com.medicalerp.contacto.service;

import com.medicalerp.contacto.entity.MensajeContacto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.core.env.Environment;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Email Service (DOM-CON-002)
 * Sends async email notifications when contact messages arrive
 */
@Slf4j
@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Autowired(required = false)
    private Environment env;

    @Value("${spring.mail.username:noreply@optimalhealth.com}")
    private String fromEmail;

    @Value("${app.contact.notification-email:alonsopicho@gmail.com}")
    private String notificationEmail;

    @Async
    public void sendContactNotification(MensajeContacto mensaje) {
        if (mailSender == null) {
            log.debug("JavaMailSender not configured, skipping contact notification email");
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(notificationEmail);
            try {
                helper.setFrom(fromEmail, "Optimal Health NOW");
            } catch (java.io.UnsupportedEncodingException e) {
                helper.setFrom(fromEmail);
            }
            helper.setReplyTo(mensaje.getEmail());
            helper.setSubject("Nuevo mensaje de contacto: " + (mensaje.getAsunto() != null ? mensaje.getAsunto() : "Sin asunto"));

            String htmlContent = buildNotificationHtml(mensaje);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Contact notification email sent for message id={} from {}", mensaje.getId(), mensaje.getEmail());

        } catch (MessagingException e) {
            log.error("Failed to send contact notification email for message id={}", mensaje.getId(), e);
        }
    }

    private String buildNotificationHtml(MensajeContacto mensaje) {
        return """
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: #0d2137;">Nuevo mensaje de contacto</h2>
                    <p><strong>Nombre:</strong> %s</p>
                    <p><strong>Email:</strong> <a href="mailto:%s">%s</a></p>
                    <p><strong>Teléfono:</strong> %s</p>
                    <p><strong>Asunto:</strong> %s</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p><strong>Mensaje:</strong></p>
                    <p style="background: #f8fafc; padding: 15px; border-radius: 4px; white-space: pre-wrap;">%s</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #64748b;">
                        IP: %s | User-Agent: %s | Fecha: %s
                    </p>
                    <p style="font-size: 12px; color: #64748b;">
                        Responder directamente a este email para contactar al remitente.
                    </p>
                </div>
            </body>
            </html>
            """.formatted(
                escapeHtml(mensaje.getNombre()),
                mensaje.getEmail(),
                mensaje.getEmail(),
                mensaje.getTelefono() != null ? mensaje.getTelefono() : "No proporcionado",
                mensaje.getAsunto() != null ? mensaje.getAsunto() : "Sin asunto",
                escapeHtml(mensaje.getMensaje()),
                mensaje.getIpAddress() != null ? mensaje.getIpAddress() : "N/A",
                mensaje.getUserAgent() != null ? mensaje.getUserAgent() : "N/A",
                mensaje.getCreatedAt()
            );
    }

    @Async
    public void sendOtpEmail(String toEmail, String codigo, int expirationMinutes) {
        if (mailSender == null) {
            log.debug("JavaMailSender not configured, skipping OTP email to {}", toEmail);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            try {
                helper.setFrom(fromEmail, "Optimal Health NOW");
            } catch (java.io.UnsupportedEncodingException e) {
                helper.setFrom(fromEmail);
            }
            helper.setSubject("Tu código de acceso - Optimal Health NOW");

            String htmlContent = buildOtpHtml(codigo, expirationMinutes);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("OTP email sent to {}", toEmail);

        } catch (MessagingException e) {
            log.error("Failed to send OTP email to {}", toEmail, e);
        }
    }

    private String buildOtpHtml(String codigo, int expirationMinutes) {
        return """
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="font-family: Arial, sans-serif; color: #333; background: #f4f6f8; margin: 0; padding: 0;">
                <div style="max-width: 500px; margin: 40px auto; padding: 0;">
                    <div style="background: #0d2137; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
                        <h2 style="color: #ffffff; margin: 0; font-size: 20px;">Optimal Health NOW</h2>
                        <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 14px;">ERP Médico - Autenticación Segura</p>
                    </div>
                    <div style="background: #ffffff; padding: 32px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
                        <p style="font-size: 16px; margin: 0 0 16px 0;">Hola,</p>
                        <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                            Para acceder al sistema, utiliza el siguiente código de verificación:
                        </p>
                        <div style="text-align: center; margin: 24px 0;">
                            <div style="display: inline-block; background: #f1f5f9; border: 2px dashed #0d2137; border-radius: 8px; padding: 20px 40px;">
                                <span style="font-size: 36px; font-weight: bold; color: #0d2137; letter-spacing: 8px;">%s</span>
                            </div>
                        </div>
                        <p style="font-size: 14px; color: #64748b; text-align: center; margin: 0 0 24px 0;">
                            Este código expira en <strong>%d minutos</strong>.
                        </p>
                        <p style="font-size: 13px; color: #94a3b8; text-align: center; margin: 0;">
                            Si no solicitaste este código, ignora este mensaje.<br>
                            No compartas este código con nadie.
                        </p>
                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
                        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
                            Este es un mensaje automático de Optimal Health NOW ERP.<br>
                            © 2026 Optimal Health NOW - Todos los derechos reservados.
                        </p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(codigo, expirationMinutes);
    }

    private String escapeHtml(String text) {
        if (text == null) return "";
        return text
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;");
    }

    /**
     * Email de confirmación de cita al paciente
     */
    @Async
    public void sendCitaConfirmacionPaciente(String toEmail, String pacienteNombre, String fecha, String hora, String doctoraNombre, String tipoCita) {
        try {
            if (mailSender == null) {
                log.warn("JavaMailSender not configured, skipping email to {}", toEmail);
                return;
            }
            String fromEmail = env.getProperty("spring.mail.username", "noreply@medicalerp.com");
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Cita Confirmada - Optimal Health NOW");

            String html = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #3B82F6, #60A5FA); padding: 24px; text-align: center;">
                        <h1 style="color: white; margin: 0;">Cita Confirmada</h1>
                    </div>
                    <div style="background: #f8fafc; padding: 24px;">
                        <p>Hola <strong>%s</strong>,</p>
                        <p>Su cita ha sido confirmada:</p>
                        <div style="background: white; border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 4px solid #3B82F6;">
                            <p><strong>Fecha:</strong> %s</p>
                            <p><strong>Hora:</strong> %s</p>
                            <p><strong>Doctora:</strong> %s</p>
                            <p><strong>Tipo:</strong> %s</p>
                        </div>
                        <p style="color: #64748B; font-size: 12px;">Optimal Health NOW - Medical ERP</p>
                    </div>
                </div>
                """.formatted(pacienteNombre, fecha, hora, doctoraNombre, tipoCita);
            helper.setText(html, true);
            mailSender.send(message);
            log.info("Email de confirmación enviado a {}", toEmail);
        } catch (Exception e) {
            log.error("Error enviando email de confirmación a {}: {}", toEmail, e.getMessage());
        }
    }

    /**
     * Notificación de cita al doctora
     */
    @Async
    public void sendCitaNotificacionDoctora(String toEmail, String doctoraNombre, String pacienteNombre, String fecha, String hora, String tipoCita, String motivo, String nombreUsuario) {
        try {
            if (mailSender == null) {
                log.warn("JavaMailSender not configured, skipping email to {}", toEmail);
                return;
            }
            String fromEmail = env.getProperty("spring.mail.username", "noreply@medicalerp.com");
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Nueva Cita Agendada - Notificación");

            String html = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #8B5CF6, #A78BFA); padding: 24px; text-align: center;">
                        <h1 style="color: white; margin: 0;">Nueva Cita Agendada</h1>
                    </div>
                    <div style="background: #f8fafc; padding: 24px;">
                        <p>Se ha agendado una cita:</p>
                        <div style="background: white; border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 4px solid #8B5CF6;">
                            <p><strong>Paciente:</strong> %s</p>
                            <p><strong>Fecha:</strong> %s</p>
                            <p><strong>Hora:</strong> %s</p>
                            <p><strong>Tipo:</strong> %s</p>
                            <p><strong>Motivo:</strong> %s</p>
                        </div>
                        <p style="color: #64748B; font-size: 12px;">Optimal Health NOW - Medical ERP</p>
                    </div>
                </div>
                """.formatted(pacienteNombre, fecha, hora, tipoCita, motivo);
            helper.setText(html, true);
            mailSender.send(message);
            log.info("Email de notificación enviado a doctora {}", toEmail);
        } catch (Exception e) {
            log.error("Error enviando email de notificación a doctora {}: {}", toEmail, e.getMessage());
        }
    }

    /**
     * Envía el contrato firmado por email al paciente con el PDF adjunto
     */
    @Async
    public void sendContratoFirmado(String toEmail, String pacienteNombre,
                                     byte[] pdfBytes, String filename) {
        if (mailSender == null) {
            log.debug("JavaMailSender not configured, skipping contrato email to {}", toEmail);
            return;
        }
        if (pdfBytes == null || pdfBytes.length == 0) {
            log.warn("No PDF bytes to send for contrato email to {}", toEmail);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            try {
                helper.setFrom(fromEmail, "Optimal Health NOW");
            } catch (java.io.UnsupportedEncodingException e) {
                helper.setFrom(fromEmail);
            }
            helper.setSubject("Contrato de Membresia Firmado - Optimal Health NOW");

            String htmlContent = buildContratoFirmadoHtml(pacienteNombre);
            helper.setText(htmlContent, true);
            helper.addAttachment(filename, new ByteArrayResource(pdfBytes), "application/pdf");

            mailSender.send(message);
            log.info("Contrato firmado enviado por email a {} (paciente: {})", toEmail, pacienteNombre);

        } catch (MessagingException e) {
            log.error("Failed to send contrato email to {}: {}", toEmail, e.getMessage());
        }
    }

    private String buildContratoFirmadoHtml(String pacienteNombre) {
        String fecha = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy 'a las' HH:mm"));
        return """
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="font-family: Arial, sans-serif; color: #333; background: #f4f6f8; margin: 0; padding: 0;">
                <div style="max-width: 500px; margin: 40px auto; padding: 0;">
                    <div style="background: #0d2137; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
                        <h2 style="color: #ffffff; margin: 0; font-size: 20px;">Optimal Health NOW</h2>
                        <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 14px;">Contrato de Membresia</p>
                    </div>
                    <div style="background: #ffffff; padding: 32px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
                        <p style="font-size: 16px; margin: 0 0 16px 0;">Hola <strong>%s</strong>,</p>
                        <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                            Su contrato de membresia ha sido firmado exitosamente. Adjunto encontrara una copia del documento firmado.
                        </p>
                        <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center;">
                            <p style="margin: 0; font-size: 14px; color: #64748b;">Fecha de firma</p>
                            <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: bold; color: #0d2137;">%s</p>
                        </div>
                        <p style="font-size: 13px; color: #94a3b8; text-align: center; margin: 24px 0 0 0;">
                            Este es un mensaje automatico de Optimal Health NOW.<br>
                            &copy; 2026 Optimal Health NOW - Todos los derechos reservados.
                        </p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(pacienteNombre, fecha);
    }

    /**
     * Envía evidencia clínica (imagen) al paciente por email con mensaje personalizado
     */
    @Async
    public void sendEvidenciaPaciente(String toEmail, String pacienteNombre,
                                       String descripcion, String archivoRuta,
                                       String asunto, String mensajeCustom) {
        if (mailSender == null) {
            log.debug("JavaMailSender not configured, skipping evidencia email to {}", toEmail);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            try {
                helper.setFrom(fromEmail, "Optimal Health NOW");
            } catch (java.io.UnsupportedEncodingException e) {
                helper.setFrom(fromEmail);
            }
            helper.setSubject(asunto);

            String htmlContent = buildEvidenciaHtml(pacienteNombre, descripcion, mensajeCustom);
            helper.setText(htmlContent, true);

            // Attach the image file
            java.io.File file = new java.io.File(archivoRuta);
            if (file.exists()) {
                String fileName = file.getName();
                String contentType = java.nio.file.Files.probeContentType(file.toPath());
                if (contentType == null) contentType = "application/octet-stream";
                helper.addAttachment(fileName, new org.springframework.core.io.ByteArrayResource(
                        java.nio.file.Files.readAllBytes(file.toPath())), contentType);
            }

            mailSender.send(message);
            log.info("Evidencia enviada por email a {} (paciente: {})", toEmail, pacienteNombre);

        } catch (Exception e) {
            log.error("Error enviando evidencia por email a {}: {}", toEmail, e.getMessage());
        }
    }

    private String buildEvidenciaHtml(String pacienteNombre, String descripcion, String mensajeCustom) {
        String fecha = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy 'a las' HH:mm"));
        return """
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="font-family: Arial, sans-serif; color: #333; background: #f4f6f8; margin: 0; padding: 0;">
                <div style="max-width: 500px; margin: 40px auto; padding: 0;">
                    <div style="background: #0d2137; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
                        <h2 style="color: #ffffff; margin: 0; font-size: 20px;">Optimal Health NOW</h2>
                        <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 14px;">Evidencia Clínica</p>
                    </div>
                    <div style="background: #ffffff; padding: 32px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
                        <p style="font-size: 16px; margin: 0 0 16px 0;">Hola <strong>%s</strong>,</p>
                        <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
                            Se le ha enviado una evidencia clínica adjunta a este correo.
                        </p>
                        <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 16px 0;">
                            <p style="margin: 0 0 8px 0;"><strong>Descripción:</strong> %s</p>
                            <p style="margin: 0; font-size: 12px; color: #64748b;">Fecha: %s</p>
                        </div>
                        %s
                        <p style="font-size: 13px; color: #94a3b8; text-align: center; margin: 24px 0 0 0;">
                            Este es un mensaje automatico de Optimal Health NOW.<br>
                            &copy; 2026 Optimal Health NOW - Todos los derechos reservados.
                        </p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(pacienteNombre, descripcion, fecha,
                    mensajeCustom != null && !mensajeCustom.isBlank()
                            ? "<div style=\"background: #f8fafc; border-radius: 8px; padding: 16px; margin: 16px 0;\"><p style=\"margin: 0 0 8px 0;\"><strong>Mensaje:</strong></p><p style=\"margin: 0; white-space: pre-wrap;\">" + escapeHtml(mensajeCustom) + "</p></div>"
                            : "");
    }

    /**
     * Envía consentimiento/contrato al paciente por email con mensaje personalizado
     */
    @Async
    public void sendConsentimientoPaciente(String toEmail, String pacienteNombre,
                                            String tipo, String pdfUrl,
                                            String asunto, String mensajeCustom) {
        if (mailSender == null) {
            log.debug("JavaMailSender not configured, skipping consentimiento email to {}", toEmail);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            try {
                helper.setFrom(fromEmail, "Optimal Health NOW");
            } catch (java.io.UnsupportedEncodingException e) {
                helper.setFrom(fromEmail);
            }
            helper.setSubject(asunto);

            String htmlContent = buildConsentimientoHtml(pacienteNombre, tipo, pdfUrl, mensajeCustom);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Consentimiento enviado por email a {} (paciente: {})", toEmail, pacienteNombre);

        } catch (Exception e) {
            log.error("Error enviando consentimiento por email a {}: {}", toEmail, e.getMessage());
        }
    }

    private String buildConsentimientoHtml(String pacienteNombre, String tipo, String pdfUrl, String mensajeCustom) {
        String fecha = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy 'a las' HH:mm"));
        String linkHtml = pdfUrl != null && !pdfUrl.isBlank()
                ? "<div style=\"text-align: center; margin: 16px 0;\"><a href=\"" + pdfUrl + "\" style=\"display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;\">Ver Documento</a></div>"
                : "";
        return """
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="font-family: Arial, sans-serif; color: #333; background: #f4f6f8; margin: 0; padding: 0;">
                <div style="max-width: 500px; margin: 40px auto; padding: 0;">
                    <div style="background: #0d2137; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
                        <h2 style="color: #ffffff; margin: 0; font-size: 20px;">Optimal Health NOW</h2>
                        <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 14px;">%s</p>
                    </div>
                    <div style="background: #ffffff; padding: 32px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
                        <p style="font-size: 16px; margin: 0 0 16px 0;">Hola <strong>%s</strong>,</p>
                        <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
                            Se le ha enviado un documento importante. Por favor revíselo y fírmelo digitalmente cuando sea necesario.
                        </p>
                        %s
                        <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center;">
                            <p style="margin: 0; font-size: 14px; color: #64748b;">Tipo: %s</p>
                            <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">Fecha: %s</p>
                        </div>
                        %s
                        <p style="font-size: 13px; color: #94a3b8; text-align: center; margin: 24px 0 0 0;">
                            Este es un mensaje automatico de Optimal Health NOW.<br>
                            &copy; 2026 Optimal Health NOW - Todos los derechos reservados.
                        </p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(tipo, pacienteNombre, linkHtml, tipo, fecha,
                    mensajeCustom != null && !mensajeCustom.isBlank()
                            ? "<div style=\"background: #f8fafc; border-radius: 8px; padding: 16px; margin: 16px 0;\"><p style=\"margin: 0 0 8px 0;\"><strong>Mensaje:</strong></p><p style=\"margin: 0; white-space: pre-wrap;\">" + escapeHtml(mensajeCustom) + "</p></div>"
                            : "");
    }

}
