import os
import smtplib
from email.message import EmailMessage
from typing import Optional

def send_verification_email(to_email: str, token: str) -> None:
    """
    Send an email verification link to the user.
    Uses SMTP if credentials are provided in .env, otherwise mocks the email via stdout.
    """
    # Get the front-end URL from the environment (default to localhost for dev)
    app_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    # Ensure no trailing slash
    app_url = app_url.rstrip('/')
    verification_link = f"{app_url}/?token={token}"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                background-color: #050505; /* Almost black matching dashboard */
                color: #ffffff;
                margin: 0;
                padding: 40px 20px;
                -webkit-font-smoothing: antialiased;
            }}
            .container {{
                max-width: 500px;
                margin: 0 auto;
                background-color: #111111; /* Dark card background */
                border: 1px solid #222222;
                border-radius: 8px;
                padding: 40px 30px;
                text-align: center;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            }}
            .logo {{
                font-size: 24px;
                font-weight: 700;
                color: #ffffff;
                margin-bottom: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                letter-spacing: -0.5px;
            }}
            h2 {{
                color: #ffffff;
                font-size: 20px;
                font-weight: 600;
                margin-bottom: 16px;
                letter-spacing: -0.5px;
            }}
            p {{
                font-size: 15px;
                line-height: 1.6;
                color: #a1a1aa; /* Muted text */
                margin-bottom: 32px;
            }}
            .button {{
                display: inline-block;
                background-color: #ffffff; /* Premium white button */
                color: #000000;
                text-decoration: none;
                font-weight: 600;
                padding: 12px 28px;
                border-radius: 6px;
                font-size: 15px;
                transition: transform 0.2s, opacity 0.2s;
            }}
            .button:hover {{
                opacity: 0.9;
            }}
            .footer {{
                margin-top: 40px;
                font-size: 12px;
                color: #888888;
                line-height: 1.5;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">
                <img src="https://ledger.linepixer.com/logo.png" alt="LV" width="32" height="32" style="width: 32px; height: 32px; margin-right: 10px; display: inline-block; vertical-align: middle;">
                <span style="vertical-align: middle;">LedgerView</span>
            </div>
            <h2>Confirma tu dirección de email</h2>
            <p>
                Gracias por registrarte en LedgerView. Para empezar a hacer un seguimiento de tus inversiones y acceder a tu dashboard, necesitamos que valides tu cuenta.
            </p>
            <a href="{verification_link}" class="button">Verificar mi cuenta</a>
            
            <div class="footer">
                Si no solicitaste crear una cuenta, puedes ignorar este correo.<br>
                LedgerView &copy; 2026
            </div>
        </div>
    </body>
    </html>
    """

    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_host = os.getenv("SMTP_HOST", "smtp.zoho.com")
    smtp_port = int(os.getenv("SMTP_PORT", 465))

    if smtp_user and smtp_password:
        try:
            msg = EmailMessage()
            msg.set_content("Por favor verifica tu correo usando este enlace: " + verification_link)
            msg.add_alternative(html_content, subtype='html')
            msg['Subject'] = 'LedgerView - Verifica tu cuenta'
            msg['From'] = f"LedgerView <{smtp_user}>"
            msg['To'] = to_email

            with smtplib.SMTP_SSL(smtp_host, smtp_port) as server:
                server.login(smtp_user, smtp_password)
                server.send_message(msg)
            print(f"Verification email sent to {to_email} via SMTP.")
        except Exception as e:
            print(f"Error sending email: {e}")
    else:
        # Mock mode
        print("\n" + "="*50)
        print("MOCK EMAIL VERIFICATION")
        print("="*50)
        print(f"To: {to_email}")
        print(f"Subject: LedgerView - Verifica tu cuenta")
        print(f"Verification Link: {verification_link}")
        print("="*50 + "\n")

def send_password_reset_email(to_email: str, token: str) -> None:
    """
    Send a password reset link to the user.
    """
    # Get the front-end URL from the environment (default to localhost for dev)
    app_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    # Ensure no trailing slash
    app_url = app_url.rstrip('/')
    reset_link = f"{app_url}/reset-password?token={token}"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                background-color: #050505;
                color: #ffffff;
                margin: 0;
                padding: 40px 20px;
                -webkit-font-smoothing: antialiased;
            }}
            .container {{
                max-width: 500px;
                margin: 0 auto;
                background-color: #111111;
                border: 1px solid #222222;
                border-radius: 8px;
                padding: 40px 30px;
                text-align: center;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            }}
            .logo {{
                font-size: 24px;
                font-weight: 700;
                color: #ffffff;
                margin-bottom: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                letter-spacing: -0.5px;
            }}
            h2 {{
                color: #ffffff;
                font-size: 20px;
                font-weight: 600;
                margin-bottom: 16px;
                letter-spacing: -0.5px;
            }}
            p {{
                font-size: 15px;
                line-height: 1.6;
                color: #a1a1aa;
                margin-bottom: 32px;
            }}
            .button {{
                display: inline-block;
                background-color: #ffffff;
                color: #000000;
                text-decoration: none;
                font-weight: 600;
                padding: 12px 28px;
                border-radius: 6px;
                font-size: 15px;
                transition: transform 0.2s, opacity 0.2s;
            }}
            .button:hover {{
                opacity: 0.9;
            }}
            .footer {{
                margin-top: 40px;
                font-size: 12px;
                color: #888888;
                line-height: 1.5;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">
                <img src="https://ledger.linepixer.com/logo.png" alt="LV" width="32" height="32" style="width: 32px; height: 32px; margin-right: 10px; display: inline-block; vertical-align: middle;">
                <span style="vertical-align: middle;">LedgerView</span>
            </div>
            <h2>Restablece tu contraseña</h2>
            <p>
                Hemos recibido una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo para elegir una nueva contraseña. El enlace es válido por 24 horas.
            </p>
            <a href="{reset_link}" class="button">Restablecer contraseña</a>
            
            <div class="footer">
                Si no solicitaste un restablecimiento de contraseña, puedes ignorar este correo.<br>
                LedgerView &copy; 2026
            </div>
        </div>
    </body>
    </html>
    """

    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_host = os.getenv("SMTP_HOST", "smtp.zoho.com")
    smtp_port = int(os.getenv("SMTP_PORT", 465))

    if smtp_user and smtp_password:
        try:
            msg = EmailMessage()
            msg.set_content("Por favor restablece tu contraseña usando este enlace: " + reset_link)
            msg.add_alternative(html_content, subtype='html')
            msg['Subject'] = 'LedgerView - Restablece tu contraseña'
            msg['From'] = f"LedgerView <{smtp_user}>"
            msg['To'] = to_email

            with smtplib.SMTP_SSL(smtp_host, smtp_port) as server:
                server.login(smtp_user, smtp_password)
                server.send_message(msg)
            print(f"Password reset email sent to {to_email} via SMTP.")
        except Exception as e:
            print(f"Error sending email: {e}")
    else:
        # Mock mode
        print("\n" + "="*50)
        print("MOCK PASSWORD RESET EMAIL")
        print("="*50)
        print(f"To: {to_email}")
        print(f"Subject: LedgerView - Restablece tu contraseña")
        print(f"Reset Link: {reset_link}")
        print("="*50 + "\n")

