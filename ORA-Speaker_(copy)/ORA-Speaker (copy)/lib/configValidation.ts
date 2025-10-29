// Configuration validation utility for environment variables

interface RequiredEnvVars {
  [key: string]: string | undefined;
}

interface ValidationResult {
  isValid: boolean;
  missingVars: string[];
  errors: string[];
}

/**
 * Validates that required environment variables are set
 * @param requiredVars - Object mapping variable names to their values
 * @returns Validation result with missing variables and errors
 */
export function validateEnvVars(requiredVars: RequiredEnvVars): ValidationResult {
  const missingVars: string[] = [];
  const errors: string[] = [];

  for (const [key, value] of Object.entries(requiredVars)) {
    if (!value || value.trim() === '') {
      missingVars.push(key);
      errors.push(`Missing required environment variable: ${key}`);
    }
  }

  return {
    isValid: missingVars.length === 0,
    missingVars,
    errors,
  };
}

/**
 * Validates core application environment variables
 * @throws Error if required variables are missing
 */
export function validateCoreConfig(): void {
  const coreVars: RequiredEnvVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    AWS_REGION: process.env.AWS_REGION,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  };

  const result = validateEnvVars(coreVars);

  if (!result.isValid) {
    throw new Error(
      `Configuration validation failed:\n${result.errors.join('\n')}`
    );
  }
}

/**
 * Validates external AI configuration
 * @returns Validation result for external AI config
 */
export function validateExternalAIConfig(): ValidationResult {
  const externalAIVars: RequiredEnvVars = {
    EXTERNAL_AI_API_URL: process.env.EXTERNAL_AI_API_URL,
  };

  return validateEnvVars(externalAIVars);
}

/**
 * Checks if external AI integration is enabled and properly configured
 * @returns true if external AI should be used, false otherwise
 */
export function isExternalAIEnabled(): boolean {
  const enabled = process.env.EXTERNAL_AI_ENABLED?.toLowerCase();
  
  // Check if feature flag is explicitly enabled
  if (enabled !== 'true') {
    return false;
  }

  // Validate that required config is present
  const validation = validateExternalAIConfig();
  
  if (!validation.isValid) {
    console.warn(
      'External AI is enabled but configuration is incomplete:',
      validation.errors.join(', ')
    );
    return false;
  }

  return true;
}

/**
 * Gets external AI configuration with defaults
 * @returns Configuration object for external AI client
 */
export function getExternalAIConfig() {
  return {
    apiUrl: process.env.EXTERNAL_AI_API_URL || '',
    timeout: parseInt(process.env.EXTERNAL_AI_TIMEOUT || '120000', 10),
    enabled: isExternalAIEnabled(),
  };
}
