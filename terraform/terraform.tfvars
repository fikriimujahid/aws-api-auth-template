# ============================================================================
# Common Variables
# ============================================================================
project_name = "testing"
environment  = "dev"
tags = {
  Owner       = "platform-team"
  CostCenter  = "kjl"
  Project     = "testing"
  Environment = "dev"
  ManagedBy   = "Terraform"
}

# -------------------------------------------------------------------------
# COGNITO AUTH MODULE
# -------------------------------------------------------------------------
auth_cognito = {
  callback_urls = [
    "https://dev.myapp.com/auth/callback"
  ]

  logout_urls = [
    "https://dev.myapp.com/logout"
  ]

  token_validity = {
    access_token_validity  = 1
    id_token_validity      = 1
    refresh_token_validity = 30
    token_validity_units = {
      access_token  = "hours"
      id_token      = "hours"
      refresh_token = "days"
    }
  }

  user_pool_schema_attributes = [
    {
      name                = "email"
      attribute_data_type = "String"
      required            = true
      mutable             = true
      string_attribute_constraints = {
        min_length = 5
        max_length = 2048
      }
    },
    {
      name                = "name"
      attribute_data_type = "String"
      required            = false
      mutable             = true
      string_attribute_constraints = {
        min_length = 1
        max_length = 2048
      }
    }
  ]

  enabled_identity_providers = ["COGNITO"]
  verification_message_template = {
    default_email_option  = "CONFIRM_WITH_LINK"
    email_subject_by_link = "Verifikasi email akun test"
    email_message_by_link = <<-EOT
      <!DOCTYPE html>
      <html lang="id">
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
      <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Helvetica Neue',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
          <tr><td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

              <!-- Header -->
              <tr><td align="center" style="padding:0 0 24px 0;">
                <span style="font-size:22px;font-weight:700;color:#1a1a2e;letter-spacing:-0.5px;">KeJepang<span style="color:#e63946;">Dulu</span></span>
              </td></tr>

              <!-- Card -->
              <tr><td style="background:#ffffff;border-radius:16px;padding:40px 40px 32px;box-shadow:0 2px 12px rgba(0,0,0,0.06);">

                <!-- Icon -->
                <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:24px;">
                  <div style="width:64px;height:64px;background:#fff0f1;border-radius:50%;display:inline-block;line-height:64px;text-align:center;font-size:28px;">&#9993;</div>
                </td></tr></table>

                <!-- Title -->
                <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#1a1a2e;text-align:center;">Verifikasi Email Kamu</h1>

                <!-- Body -->
                <p style="margin:0 0 8px;font-size:15px;color:#555;text-align:center;line-height:1.6;">Halo, selamat datang di <strong>test</strong>!</p>
                <p style="margin:0 0 32px;font-size:15px;color:#555;text-align:center;line-height:1.6;">Satu langkah lagi — klik tombol di bawah untuk mengaktifkan akun dan mulai belajar bahasa Jepang.</p>

                <!-- CTA Button -->
                <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:32px;">
                  {##Click Here##}
                </td></tr></table>

                <!-- Divider -->
                <hr style="border:none;border-top:1px solid #f0f0f0;margin:0 0 24px;">

                <!-- Disclaimer -->
                <p style="margin:0;font-size:13px;color:#aaa;text-align:center;line-height:1.5;">Jika kamu tidak merasa membuat akun ini, kamu bisa mengabaikan email ini dengan aman.</p>
              </td></tr>

              <!-- Footer -->
              <tr><td align="center" style="padding:24px 0 0;">
                <p style="margin:0;font-size:12px;color:#bbb;">&copy; 2026 test. All rights reserved.</p>
              </td></tr>

            </table>
          </td></tr>
        </table>
      </body>
      </html>
    EOT
  }
}

# ============================================================================
# Service API Variables
# ============================================================================
service_api = {
  auth_cookie_config = {
    allowed_origin                 = ""
    cookie_domain                  = ""
    cookie_secure                  = true
    cookie_same_site               = "None"
    refresh_cookie_name            = "refresh_token"
    refresh_cookie_path            = "/api/auth/refresh"
    refresh_cookie_max_age_seconds = 2592000
  }

  lambdas = {
    auth = {
      name        = "test-dev-auth-api"
      description = "Auth API Lambda."
      source_dir  = "../apps/auth/build"
      handler     = "apps/auth/src/handler.handler"
      runtime     = "nodejs22.x"
      memory_size = 256
      timeout     = 15
      publish     = true
    }
  }

  api_gateway = {
    name        = "test-dev-service-api"
    description = "Service API."
    stage_name  = "$default"

    cors_allow_origins  = ["*"]
    cors_allow_methods  = ["GET", "POST", "OPTIONS"]
    cors_allow_headers  = ["content-type", "authorization", "x-internal-api-key"]
    cors_expose_headers = []
    cors_max_age        = 300

    routes = {
      register_under_api = {
        route_key          = "POST /api/auth/register"
        authorization_type = "NONE"
        operation_name     = "RegisterUnderApi"
        integration_key    = "auth"
      }
      login_under_api = {
        route_key          = "POST /api/auth/login"
        authorization_type = "NONE"
        operation_name     = "LoginUnderApi"
        integration_key    = "auth"
      }
      refresh_session_under_api = {
        route_key          = "POST /api/auth/refresh"
        authorization_type = "NONE"
        operation_name     = "RefreshSessionUnderApi"
        integration_key    = "auth"
      }
      forgot_password_under_api = {
        route_key          = "POST /api/auth/forgot-password"
        authorization_type = "NONE"
        operation_name     = "ForgotPasswordUnderApi"
        integration_key    = "auth"
      }
      confirm_forgot_password_under_api = {
        route_key          = "POST /api/auth/forgot-password/confirm"
        authorization_type = "NONE"
        operation_name     = "ConfirmForgotPasswordUnderApi"
        integration_key    = "auth"
      }
      get_session_under_api = {
        route_key          = "GET /api/auth/session"
        authorization_type = "NONE"
        operation_name     = "GetSessionUnderApi"
        integration_key    = "auth"
      }
      logout_under_api = {
        route_key          = "POST /api/auth/logout"
        authorization_type = "NONE"
        operation_name     = "LogoutUnderApi"
        integration_key    = "auth"
      }
    }
  }
  cloudfront_path_pattern = "/api/*"
}