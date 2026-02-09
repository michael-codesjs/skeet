variable "database_url" {
  description = "Sensitive database URL"
  type        = string
  sensitive   = true
}

variable "gemini_api_key" {
  description = "Sensitive Gemini API Key"
  type        = string
  sensitive   = true
}
