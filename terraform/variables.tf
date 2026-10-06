# ============================================================================
# Common Variables
# ============================================================================
variable "project_name" {
  description = "Project prefix used in resource names."
  type        = string
}

variable "environment" {
  description = "Deployment environment."
  type        = string
}

variable "tags" {
  description = "Additional tags applied to all resources."
  type        = map(string)
}

# -------------------------------------------------------------------------
# SERVICE API MODULE
# -------------------------------------------------------------------------
variable "service_api" {
  description = "Service API settings for Lambda, API Gateway, and CloudFront route path."
  type = object({
    lambdas = map(object({
      name        = string
      description = optional(string)
      source_dir  = string
      handler     = string
      runtime     = string
      memory_size = number
      timeout     = number
      publish     = bool
    }))

    api_gateway = object({
      name                = optional(string)
      description         = optional(string)
      stage_name          = optional(string)
      cors_allow_origins  = list(string)
      cors_allow_methods  = list(string)
      cors_allow_headers  = list(string)
      cors_expose_headers = list(string)
      cors_max_age        = number
      routes = map(object({
        route_key              = string
        payload_format_version = optional(string)
        timeout_milliseconds   = optional(number)
        authorization_type     = optional(string)
        authorizer_id          = optional(string)
        operation_name         = optional(string)
        integration_key        = string
      }))
    })

    cloudfront_path_pattern = string

    auth_cookie_config = optional(object({
      allowed_origin                 = optional(string, "")
      cookie_domain                  = optional(string, "")
      cookie_secure                  = optional(bool, true)
      cookie_same_site               = optional(string, "None")
      refresh_cookie_name            = optional(string, "refresh_token")
      refresh_cookie_path            = optional(string, "/api/auth/refresh")
      refresh_cookie_max_age_seconds = optional(number, 2592000)
    }), {})
  })
}

# -------------------------------------------------------------------------
# COGNITO AUTH MODULE
# -------------------------------------------------------------------------
variable "auth_cognito" {
  description = "Cognito user pool and user pool client settings."
  type = object({
    callback_urls = list(string)
    logout_urls   = list(string)

    user_pool_schema_attributes = optional(list(object({
      name                     = string
      attribute_data_type      = string
      developer_only_attribute = optional(bool, false)
      mutable                  = optional(bool, true)
      required                 = optional(bool, false)
      string_attribute_constraints = optional(object({
        min_length = optional(number)
        max_length = optional(number)
      }))
      number_attribute_constraints = optional(object({
        min_value = optional(number)
        max_value = optional(number)
      }))
      })), [
      {
        name                = "email"
        attribute_data_type = "String"
        required            = true
        mutable             = true
        string_attribute_constraints = {
          min_length = 5
          max_length = 2048
        }
      }
    ])

    token_validity = optional(object({
      access_token_validity  = optional(number)
      id_token_validity      = optional(number)
      refresh_token_validity = optional(number)
      token_validity_units = optional(object({
        access_token  = optional(string, "hours")
        id_token      = optional(string, "hours")
        refresh_token = optional(string, "days")
      }), {})
    }), {})

    enabled_identity_providers = optional(list(string), ["COGNITO"])
    verification_message_template = optional(object({
      default_email_option  = optional(string)
      email_message         = optional(string)
      email_message_by_link = optional(string)
      email_subject         = optional(string)
      email_subject_by_link = optional(string)
      sms_message           = optional(string)
    }))

    google_client_id     = optional(string)
    google_client_secret = optional(string)
  })
}