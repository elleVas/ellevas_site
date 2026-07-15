/**
 * Shared configuration constants for the infrastructure stacks.
 *
 * Centralizes domain, account, and region values to avoid
 * magic strings scattered across stack definitions.
 */

/** Primary domain managed by Route53 */
export const DOMAIN_NAME = 'ellevas.dev';

/** www subdomain — will redirect to the apex */
export const WWW_DOMAIN = `www.${DOMAIN_NAME}`;

/** AWS Account ID */
export const ACCOUNT_ID = '583359355881';

/** Region for the main resources (S3, CloudFront origin, etc.) */
export const PRIMARY_REGION = 'eu-central-1';

/**
 * Region for the ACM certificate.
 * CloudFront requires certificates to be in us-east-1 — this is an AWS constraint.
 */
export const CERTIFICATE_REGION = 'us-east-1';

/** Tag applied to all resources for cost tracking */
export const PROJECT_TAG = 'ellevas-site';
