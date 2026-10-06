variable "project_name" {
  description = "Project name used as the resource naming prefix."
  type        = string
}

variable "environment" {
  description = "Environment name used for naming and tagging."
  type        = string
}

variable "tags" {
  description = "Additional tags applied to all resources."
  type        = map(string)
  default     = {}
}

# -----------------------------------------------------------------------------
# COGNITO
# -----------------------------------------------------------------------------
variable "callback_urls" {
  description = "OAuth callback URLs used by Cognito after sign-in."
  type        = list(string)
}

variable "logout_urls" {
  description = "OAuth logout redirect URLs used by Cognito sign-out."
  type        = list(string)
}

variable "user_pool_schema_attributes" {
  description = "Cognito user pool schema attributes."
  type = list(object({
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
  }))
  default = [
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
  ]

  validation {
    condition = length(var.user_pool_schema_attributes) > 0 && length(distinct([
      for attribute in var.user_pool_schema_attributes : attribute.name
    ])) == length(var.user_pool_schema_attributes)
    error_message = "user_pool_schema_attributes must contain unique names and cannot be empty."
  }

  validation {
    condition = contains([
      for attribute in var.user_pool_schema_attributes : lower(attribute.name)
    ], "email")
    error_message = "user_pool_schema_attributes must include the email attribute."
  }

  validation {
    condition = alltrue([
      for attribute in var.user_pool_schema_attributes :
      contains(["String", "Number", "Boolean", "DateTime"], attribute.attribute_data_type)
    ])
    error_message = "attribute_data_type must be one of String, Number, Boolean, DateTime."
  }
}

variable "enabled_identity_providers" {
  description = "Identity providers enabled on the Cognito app client. Supported values: COGNITO and Google."
  type        = list(string)
  default     = ["COGNITO"]

  validation {
    condition = alltrue([
      for provider in var.enabled_identity_providers :
      contains(["COGNITO", "Google"], provider)
    ])
    error_message = "enabled_identity_providers can contain only COGNITO and Google."
  }

  validation {
    condition     = contains(var.enabled_identity_providers, "COGNITO")
    error_message = "enabled_identity_providers must include COGNITO."
  }
}

variable "google_client_id" {
  description = "Google OAuth client ID used by Cognito identity provider."
  type        = string
  default     = null

  validation {
    condition     = !contains(var.enabled_identity_providers, "Google") || (var.google_client_id != null && trimspace(var.google_client_id) != "")
    error_message = "google_client_id is required when enabled_identity_providers includes Google."
  }
}

variable "google_client_secret" {
  description = "Google OAuth client secret used by Cognito identity provider."
  type        = string
  sensitive   = true
  default     = null

  validation {
    condition     = !contains(var.enabled_identity_providers, "Google") || (var.google_client_secret != null && trimspace(var.google_client_secret) != "")
    error_message = "google_client_secret is required when enabled_identity_providers includes Google."
  }
}

variable "verification_message_template" {
  description = "Optional verification message template for the Cognito user pool."
  type = object({
    default_email_option  = optional(string)
    email_message         = optional(string)
    email_message_by_link = optional(string)
    email_subject         = optional(string)
    email_subject_by_link = optional(string)
    sms_message           = optional(string)
  })
  default = null
}

variable "token_validity" {
  description = "Optional token lifetime configuration for Cognito app clients."
  type = object({
    access_token_validity  = optional(number)
    id_token_validity      = optional(number)
    refresh_token_validity = optional(number)
    token_validity_units = optional(object({
      access_token  = optional(string, "hours")
      id_token      = optional(string, "hours")
      refresh_token = optional(string, "days")
    }), {})
  })
  default = {}

  validation {
    condition = alltrue([
      for value in [
        try(var.token_validity.access_token_validity, null),
        try(var.token_validity.id_token_validity, null),
        try(var.token_validity.refresh_token_validity, null)
      ] : value == null || value > 0
    ])
    error_message = "Token validity values must be greater than 0 when provided."
  }

  validation {
    condition = alltrue([
      for unit in [
        try(var.token_validity.token_validity_units.access_token, "hours"),
        try(var.token_validity.token_validity_units.id_token, "hours"),
        try(var.token_validity.token_validity_units.refresh_token, "days")
      ] : contains(["seconds", "minutes", "hours", "days"], unit)
    ])
    error_message = "Token validity units must be one of: seconds, minutes, hours, days."
  }
}

# -----------------------------------------------------------------------------
# LAMBDAS
# -----------------------------------------------------------------------------
variable "lambdas" {
  description = "Map of Lambda function settings keyed by integration key."
  type = map(object({
    name        = string
    description = optional(string)
    source_dir  = string
    handler     = string
    runtime     = string
    memory_size = number
    timeout     = number
    publish     = bool
  }))

  validation {
    condition     = length(var.lambdas) > 0
    error_message = "At least one lambda must be configured."
  }
}

variable "additional_integrations" {
  description = "Additional non-managed Lambda integrations selectable by integration_key."
  type = map(object({
    integration_uri = string
    function_name   = string
  }))
  default = {}
}

# -----------------------------------------------------------------------------
# API GATEWAY
# -----------------------------------------------------------------------------
variable "api_gateway" {
  description = "API Gateway settings."
  type = object({
    name        = string
    description = string
    stage_name  = string

    cors_allow_origins  = list(string)
    cors_allow_methods  = list(string)
    cors_allow_headers  = list(string)
    cors_expose_headers = list(string)
    cors_max_age        = number

    routes = map(object({
      route_key              = string
      payload_format_version = optional(string, "2.0")
      timeout_milliseconds   = optional(number, 30000)
      authorization_type     = optional(string, "NONE")
      authorizer_id          = optional(string)
      operation_name         = optional(string)
      integration_key        = string
    }))
  })
}

# -----------------------------------------------------------------------------
# AUTH COOKIE CONFIG
# -----------------------------------------------------------------------------
variable "auth_cookie_config" {
  description = "Authentication cookie and CORS configuration."
  type = object({
    allowed_origin                 = optional(string, "")
    cookie_domain                  = optional(string, "")
    cookie_secure                  = optional(bool, true)
    cookie_same_site               = optional(string, "None")
    refresh_cookie_name            = optional(string, "refresh_token")
    refresh_cookie_path            = optional(string, "/api/auth/refresh")
    refresh_cookie_max_age_seconds = optional(number, 2592000)
  })
  default = {}
}
